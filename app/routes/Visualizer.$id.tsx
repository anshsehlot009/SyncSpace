import { useLocation, useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { generate3DView } from "../../lib/ai.action";
import { getProjectById } from "../../lib/puter.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../ui/Button";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state =
        location.state as
            | (VisualizerLocationState & { initialRendered?: string | null })
            | null;

    const initialImage = state?.initialImage ?? null;
    const initialRender = state?.initialRender ?? state?.initialRendered ?? null;
    const name = state?.name ?? null;

    const hasInitialGenerated = useRef(false);
    const [project, setProject] = useState<DesignItem|null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>( null);

    const resolvedInitialImage = initialImage ?? project?.sourceImage ?? null;
    const resolvedInitialRender = initialRender ?? project?.renderedImage ?? null;
    const projectName = name || project?.name || "Untitled Project";

    useEffect(() => {
        if (!id || initialImage) return;
        let isActive = true;

        const fetchProject = async () => {
            setIsProjectLoading(true);
            const fetched = await getProjectById({ id });
            if (!isActive) return;
            setProject(fetched);
            setIsProjectLoading(false);
            if (fetched?.renderedImage) {
                setCurrentImage((prev) => prev ?? fetched.renderedImage);
            }
        };

        fetchProject();

        return () => {
            isActive = false;
        };
    }, [id, initialImage]);

    const handleBack = useCallback(() => navigate("/"), [navigate]);
    const handleExport = useCallback(() => {
        if (!currentImage) return;
        const safeName = projectName.replace(/\s+/g, "-").toLowerCase();
        const link = document.createElement("a");
        link.href = currentImage;
        link.download = `${safeName || "syncspace-render"}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }, [currentImage, projectName]);
    const handleShare = useCallback(async () => {
        if (!currentImage) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: projectName,
                    url: currentImage,
                });
                return;
            } catch (error) {
                console.warn("Share canceled or failed.", error);
            }
        }
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(currentImage);
            } catch (error) {
                console.warn("Failed to copy link to clipboard.", error);
            }
        }
    }, [currentImage, projectName]);

    const runGeneration = useCallback(async () => {
        if (!resolvedInitialImage) return;

        try {
            setIsProcessing(true);

            const result = await generate3DView({
                sourceImage: resolvedInitialImage,
            });

            if (result?.renderedImage) {
                setCurrentImage(result.renderedImage);
            }
        } catch (e) {
            console.error("generation error", e);
        } finally {
            setIsProcessing(false);
        }
    }, [resolvedInitialImage]);

    useEffect(() => {
        if (!resolvedInitialImage || hasInitialGenerated.current) return;

        if (resolvedInitialRender) {
            setCurrentImage(resolvedInitialRender);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        runGeneration();
    }, [resolvedInitialImage, resolvedInitialRender, runGeneration]);

    return (
        <section>
            <button onClick={handleBack}>Back</button>

            <div className="visualizer">
                <nav className="topbar">
                    <div className="brand">
                        <Box className="logo" />
                        <span className="name">SyncSpace</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="exit"
                    >
                        <X className="icon" />
                        Exit Editor
                    </Button>
                </nav>

                <section className="content">
                    <div className="panel">
                        <div className="panel-header">
                            <div className="panel-meta">
                                <p> Project</p>
                                <h2>{projectName}</h2>
                                <p className="note">Created by You </p>
                            </div>

                            <div className="panel-actions">
                                <Button
                                    size="sm"
                                    onClick={handleExport}
                                    className="export"
                                    disabled={!currentImage}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleShare}
                                    className="share"
                                    disabled={!currentImage}
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </div>

                        <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
                            {currentImage? (
                                <img  src={currentImage} alt="Ai Render"
                                className="render-img"/>
                            ):(
                                <div className="render-placeholder">
                                    {resolvedInitialImage && (
                                        <img src={resolvedInitialImage} alt="original "
                                        className="render-fallback"/>
                                    )}
                                </div>
                            )}


                            {isProcessing && (
                                <div className="render-overlay">
                                    <div className={"rendering-card"}>
                                        <RefreshCcw className={"spinner"}/>
                                        <span className="title"> Rendering ...</span>
                                        <span className="subtitle"> Generating your 3D visualization </span>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {resolvedInitialImage ? (
                    <div className="image-container">
                        <h2>{name || "Uploaded Image"}</h2>
                        <img
                            src={resolvedInitialImage}
                            alt={name || "Uploaded"}
                            style={{ maxWidth: "100%", height: "auto" }}
                        />
                    </div>
                ) : (
                    <p>{isProjectLoading ? "Loading project..." : "No image uploaded"}</p>
                )}

                {isProcessing && <p>Generating 3D view...</p>}

                {currentImage && (
                    <div className="image-container">
                        <h2>Generated Image</h2>
                        <img
                            src={currentImage}
                            alt="Generated"
                            style={{ maxWidth: "100%", height: "auto" }}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default VisualizerId;
