import { useLocation, useParams } from "react-router";

const VisualizerId = () => {
    const location = useLocation();
    const { initialImage, name } = location.state || {};

    console.log('Location state:', location.state);
    console.log('initialImage:', initialImage);
    console.log('initialImage type:', typeof initialImage);

    return (
        <section>
            <h1>{name || 'untitled project'}</h1>
            <div className="visualizer">
                {initialImage ? (
                    <div className="image-container">
                        <h2>Source Image</h2>
                        <img
                            src={initialImage}
                            alt="Source"
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    </div>
                ) : (
                    <p>No image uploaded</p>
                )}
            </div>
        </section>
    );
};
export default VisualizerId
