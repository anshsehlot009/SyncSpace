const PROJECT_PREFIX = "SyncSpace project ";
const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({error: message, ...extra}), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
}
const getUserId = async (userPuter) =>{
    try{
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    }
    catch {
        return null;
    }
}
router.post('/api/project/save',async ({request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");
         const  body = await  request.json();
         const project = body?.project;

         if (!project?.id || !project?.sourceImage) return jsonError(400, "Project not found.");

          const payload={
              ...project,
              updatedAt: new Date().toISOString(),
          }
          const userId = await getUserId(userPuter);
          if(!userId) return jsonError( 401, "Authentication failed");

      const key =`${PROJECT_PREFIX}${project.id}`;
      await userPuter.kv.set(key,payload);

      return {saved:true , id:project.id, project:payload};
    }catch(e){
     return jsonError(500,'failed to save project',{message:e.message || 'Unknown error'});

    }
})

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user?.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const items = await userPuter.kv.list(`${PROJECT_PREFIX}*`, true);
        const projects = items.map((item) => item.value);
        return {projects};
    } catch (e) {
        return jsonError(500, 'Failed to list projects', {message: e.message || 'Unknown error'});
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user?.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const {searchParams} = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return jsonError(400, "Project id is required");

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        return {project: project ?? null};
    } catch (e) {
        return jsonError(500, 'Failed to fetch project', {message: e.message || 'Unknown error'});
    }
})
