import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react"; // ✅ removed unused Section import
import Button from "../../ui/Button";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "SyncSpace" },
        { name: "description", content: "Welcome to SyncSpace!" },
    ];
}

export default function Home() {
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

                {/* UPLOAD SHELL */}
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
                        <p>Upload Images</p>
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
                        <div className="project-card group">
                            <div className=" preview">
                                <img
                                    src="https://cdn.dribbble.com/userupload/37588380/file/original-efbe9ff87634512ead5c0c375e1be837.jpg?resize=752x&vertical=center"
                                    alt="Project preview"
                                />
                                <div className="badge">
                                    <span>Community</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div>
                                    <h3>Project Mumbai </h3>
                                    <div className="meta">
                                        <Clock size={12}/>
                                        <span>{new Date('01.04.2026').toLocaleDateString()
                                        }</span>
                                        <span>Aeiforia Architects</span>
                                    </div>
                                </div>
                                <div className="arrow">
                                    <ArrowUpRight size={18}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}