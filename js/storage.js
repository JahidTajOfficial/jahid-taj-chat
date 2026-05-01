const STORAGE = {
  async upload(file, folder) {
    const ext = file.name.split(".").pop();
    const key = folder + "/" + Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;

    const response = await fetch(CONFIG.WORKER_URL + "/" + key, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + CONFIG.AUTH_SECRET,
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  },

  async delete(key) {
    await fetch(CONFIG.WORKER_URL + "/" + key, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + CONFIG.AUTH_SECRET,
      },
    });
  },

  getUrl(key) {
    return CONFIG.WORKER_URL + "/" + key;
  },
};
