import puter from "@heyputer/puter.js";
import { getOrCreateHostingConfig, uploadImageToHosting } from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));
const LOCAL_PROJECTS_KEY = "syncspace_projects_v1";

const readLocalProjects = (): DesignItem[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeLocalProjects = (projects: DesignItem[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch {
        // Ignore local storage errors (quota, disabled, etc.)
    }
};

const upsertLocalProject = (item: DesignItem): DesignItem => {
    const existing = readLocalProjects();
    const next = [item, ...existing.filter((project) => project.id !== item.id)];
    writeLocalProjects(next);
    return item;
};

const mergeProjects = (remote: DesignItem[], local: DesignItem[]) => {
    const map = new Map<string, DesignItem>();
    for (const item of local) {
        map.set(item.id, item);
    }
    for (const item of remote) {
        map.set(item.id, item);
    }
    return Array.from(map.values()).sort(
        (a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0),
    );
};

const ensurePuterAuth = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (puter?.authToken) return true;
    if (puter?.ui?.authenticateWithPuter) {
        try {
            await puter.ui.authenticateWithPuter();
        } catch (err) {
            console.warn("Puter authentication failed or was cancelled.", err);
            return false;
        }
    }
    return !!puter?.authToken;
};

export const signIn = async () => {
    if (typeof window === "undefined") return false;

    if (puter?.ui?.authenticateWithPuter) {
        try {
            // Defer so the dialog path is used, avoiding popup blockers.
            await nextTick();
            await puter.ui.authenticateWithPuter();
            return true;
        } catch (err) {
            console.warn("Puter authenticate dialog failed or was cancelled.", err);
        }
    }

    return await puter.auth.signIn();
};

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if(!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project save.");
        return upsertLocalProject(item);
    }

    if (!puter?.workers?.exec) {
        console.warn("Puter workers API unavailable; are you running inside Puter?");
        return upsertLocalProject(item);
    }

    const authed = await ensurePuterAuth();
    if (!authed) {
        console.warn("No Puter auth token; saving project locally.");
        return upsertLocalProject(item);
    }
    const projectId = item.id;

    try {
        const hosting = await getOrCreateHostingConfig();
        if (!hosting?.subdomain) {
            console.warn("Puter hosting unavailable; saving with unhosted image.");
        }

        const hostedSource = projectId
            ? await uploadImageToHosting({
                  hosting,
                  url: item.sourceImage,
                  projectId,
                  label: "source",
              })
            : null;

        const hostedRender =
            projectId && item.renderedImage
                ? await uploadImageToHosting({
                      hosting,
                      url: item.renderedImage,
                      projectId,
                      label: "rendered",
                  })
                : null;

        const resolvedSource = hostedSource?.url ?? item.sourceImage ?? "";

        if (!resolvedSource) {
            console.warn("Missing source image; skipping save.");
            return null;
        }

        if (!hostedSource && item.sourceImage && !isHostedUrl(item.sourceImage)) {
            console.warn("Using unhosted source image.");
        }

        const resolvedRender = hostedRender?.url ?? item.renderedImage ?? undefined;

        if (!hostedRender && item.renderedImage && !isHostedUrl(item.renderedImage)) {
            console.warn("Using unhosted rendered image.");
        }

        const {
            sourcePath: _sourcePath,
            renderedPath: _renderedPath,
            publicPath: _publicPath,
            ...rest
        } = item;

        const payload = {
            ...rest,
            sourceImage: resolvedSource,
            renderedImage: resolvedRender,
        };

        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: 'POST',
            body: JSON.stringify({
                project: payload,
                visibility
            })
        });

        if(!response.ok) {
            console.error('failed to save the project', await response.text());
            return upsertLocalProject(item);
        }

        const data = (await response.json()) as { project?: DesignItem | null }

        const savedProject = data?.project ?? null;
        if (savedProject) {
            upsertLocalProject(savedProject);
        }
        return savedProject;
    } catch (e) {
        console.log('Failed to save project', e)
        return upsertLocalProject(item);
    }
}



export const getProjects = async () => {
    const localProjects = readLocalProjects();
    if(!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return localProjects;
    }

    if (!puter?.workers?.exec) {
        console.warn("Puter workers API unavailable; returning local projects.");
        return localProjects;
    }

    const authed = await ensurePuterAuth();
    if (!authed) {
        return localProjects;
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method: 'GET' });

        if(!response.ok) {
            console.error('Failed to fetch history', await response.text());
            return [];
        }

        const data = (await response.json()) as { projects?: DesignItem[] | null };

        const remoteProjects = Array.isArray(data?.projects) ? data?.projects : [];
        return mergeProjects(remoteProjects, localProjects);
    } catch (e) {
        console.error('Failed to get projects', e);
        return localProjects;
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    const localProject = readLocalProjects().find((project) => project.id === id) ?? null;
    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return localProject;
    }

    console.log("Fetching project with ID:", id);

    try {
        const authed = await ensurePuterAuth();
        if (!authed) return localProject;

        const response = await puter.workers.exec(
            `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        console.log("Fetch project response:", response);

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const data = (await response.json()) as {
            project?: DesignItem | null;
        };

        console.log("Fetched project data:", data);

        return data?.project ?? localProject;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return localProject;
    }
};
