import type { Route } from "./+types/home";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "../../ui/Button";
import Upload from "../../components/Upload";
import { useNavigate } from "react-router";
import { createProject } from "../../lib/puter.action";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "SyncSpace" },
        { name: "description", content: "Welcome to SyncSpace!" },
    ];
}

export default function Home() {

    const navigate = useNavigate();

    const [project, setProject] = useState<DesignItem[]>([]);


    const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

    const handleUploadComplete = async (base64Data: string) => {
        const newId = Date.now().toString();
        const name = `Residence${newId}`;
        const newItem = {
            id: newId,
            name,
            sourceImage: base64Data,
            renderedImage: undefined,
            timestamp: Date.now(),
        };

        const saved = await createProject({ item: newItem, visibility: "private" });
        if (!saved) {
            console.warn("Failed to create project. Showing local preview.");
        }

        setProject((prev) => [newItem, ...prev]);

        sessionStorage.setItem(`upload_${newId}`, base64Data);

        navigate(`/visualizer/${newId}`,{
            state :{
                initialImage : saved?.sourceImage || base64Data,
                initialRendered : saved?.renderedImage || null,
                name
            }
        }); // only ID in the URL
        return true;
    };

    return (
        <div className="home">
            <Navbar />


            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>
                    <p>Introducing SyncSpace 2.0</p>
                </div>

                <h1>Build Beautiful Spaces at the Speed of Thought with SyncSpace.</h1>

                <p className="subtitle">
                    SyncSpace is an AI-first design environment that helps you visualize,
                    render, and ship architectural projects faster than ever.
                </p>

                <div className="actions">
                    <a href="#upload" className="cta">
                        Start Building <ArrowRight className="icon" />
                    </a>
                    <Button variant="outline" size="lg" className="demo">
                        Watch Demo
                    </Button>
                </div>


                <div id="upload" className="upload-shell">
                    <div className="grid-overlay"></div>

                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>
                            <h3>Upload Your Floor Plan</h3>
                            <p>Supports JPG, PNG formats up to 10MB</p>
                        </div>
                    <Upload onComplete={handleUploadComplete} />
                        {uploadedBase64 ? (
                            <p className="help">Upload complete. Base64 data is ready for the next step.</p>
                        ) : null}
                    </div>
                </div>
            </section>


            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>Projects</h2>
                            <p>Your Latest Work and Shared Community Projects, all in one Place</p>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {project.map(({id,name, renderedImage, sourceImage, timestamp})=>(
                            <div className="project-card group" key={id}>
                            <div className=" preview">
                            <img
                            src={renderedImage || sourceImage}
                            alt="Project "
                            />
                            <div className="badge">
                            <span>Community</span>
                            </div>
                            </div>
                            <div className="card-body">
                            <div>
                            <h3> { name} </h3>
                            <div className="meta">
                            <Clock size={12}/>
                    <span>{new Date(timestamp).toLocaleDateString()}
                    </span>
                    <span>Aeiforia Architects</span>
                </div>
        </div>
               <div className="arrow">
              <ArrowUpRight size={18}/>
              </div>
                </div>
                  </div>


                   ))}

                    </div>
                </div>
            </section>
        </div>
    );
}
