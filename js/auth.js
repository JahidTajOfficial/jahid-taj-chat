const AUTH = {
  currentUser: null,

  async register(username, email, password) {
    const existing = await DB.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [{ type: "text", value: email }, { type: "text", value: username }]
    );
    if (existing && existing.rows.length > 0) {
      throw new Error("Username বা Email আগে থেকেই আছে!");
    }

    const id = crypto.randomUUID();
    await DB.query(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [
        { type: "text", value: id },
        { type: "text", value: username },
        { type: "text", value: email },
        { type: "text", value: password },
      ]
    );

    const user = { id, username, email, avatar: "", bio: "" };
    this.setSession(user);
    return user;
  },

  async login(email, password) {
    const result = await DB.query(
      "SELECT id, username, email, avatar, bio FROM users WHERE email = ? AND password = ?",
      [{ type: "text", value: email }, { type: "text", value: password }]
    );

    if (!result || result.rows.length === 0) {
      throw new Error("Email বা Password ভুল!");
    }

    const row = result.rows[0];
    const user = {
      id: row[0],
      username: row[1],
      email: row[2],
      avatar: row[3],
      bio: row[4],
    };

    this.setSession(user);
    return user;
  },

  setSession(user) {
    this.currentUser = user;
    localStorage.setItem("jtc_user", JSON.stringify(user));
  },

  getSession() {
    if (this.currentUser) return this.currentUser;
    const saved = localStorage.getItem("jtc_user");
    if (saved) {
      this.currentUser = JSON.parse(saved);
      return this.currentUser;
    }
    return null;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem("jtc_user");
    window.location.href = "index.html";
  },
};
