const AUTH = {
  currentUser: null,

  async register(username, email, password) {
    const existing = await DB.query(
      "SELECT id FROM users WHERE email = :email OR username = :username",
      [
        { name: "email", value: { type: "text", value: email } },
        { name: "username", value: { type: "text", value: username } },
      ]
    );
    if (existing && existing.rows.length > 0) {
      throw new Error("Username বা Email আগে থেকেই আছে!");
    }

    const id = crypto.randomUUID();
    await DB.query(
      "INSERT INTO users (id, username, email, password) VALUES (:id, :username, :email, :password)",
      [
        { name: "id", value: { type: "text", value: id } },
        { name: "username", value: { type: "text", value: username } },
        { name: "email", value: { type: "text", value: email } },
        { name: "password", value: { type: "text", value: password } },
      ]
    );

    const user = { id, username, email, avatar: "", bio: "" };
    this.setSession(user);
    return user;
  },

  async login(email, password) {
    const result = await DB.query(
      "SELECT id, username, email, avatar, bio FROM users WHERE email = :email AND password = :password",
      [
        { name: "email", value: { type: "text", value: email } },
        { name: "password", value: { type: "text", value: password } },
      ]
    );

    if (!result || result.rows.length === 0) {
      throw new Error("Email বা Password ভুল!");
    }

    const cols = result.cols;
    const row = result.rows[0];

    const getVal = (name) => {
      const idx = cols.findIndex(c => c.name === name);
      if (idx === -1) return "";
      const v = row[idx];
      if (v === null || v === undefined) return "";
      if (typeof v === "object" && v.value !== undefined) return v.value;
      return String(v);
    };

    const user = {
      id: getVal("id"),
      username: getVal("username"),
      email: getVal("email"),
      avatar: getVal("avatar"),
      bio: getVal("bio"),
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
