const APP = {
  currentTab: "chats",
  currentChat: null,
  messageInterval: null,

  async init() {
    const user = AUTH.getSession();
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    await DB.init();
    await this.loadChats();
  },

  async loadChats() {
    const user = AUTH.getSession();
    const list = document.getElementById("chatList");
    list.innerHTML = '<div class="empty-state">Loading...</div>';

    try {
      const result = await DB.query(
        "SELECT id, username, avatar FROM users WHERE id != :uid",
        [{ name: "uid", value: { type: "text", value: user.id } }]
      );

      if (!result || result.rows.length === 0) {
        list.innerHTML = '<div class="empty-state">কোনো user নেই।</div>';
        return;
      }

      list.innerHTML = "";
      result.rows.forEach((row) => {
        const id = row[0];
        const username = row[1];
        const avatar = row[2];

        const item = document.createElement("div");
        item.className = "chat-item";
        item.innerHTML = `
          <div class="avatar">${avatar ? '<img src="' + avatar + '" />' : username[0].toUpperCase()}</div>
          <div class="chat-info">
            <div class="chat-name">${username}</div>
            <div class="chat-preview">Click to chat</div>
          </div>`;
        item.onclick = () => this.openChat({ id, username, avatar });
        list.appendChild(item);
      });
    } catch (err) {
      list.innerHTML = '<div class="empty-state">Error: ' + err.message + '</div>';
    }
  },

  async openChat(chatUser) {
    this.currentChat = chatUser;

    document.getElementById("welcome").style.display = "none";
    const chatView = document.getElementById("chatView");
    chatView.style.display = "flex";

    document.getElementById("chatName").textContent = chatUser.username;
    document.getElementById("chatStatus").textContent = "Online";
    const avatarEl = document.getElementById("chatAvatar");
    avatarEl.innerHTML = chatUser.avatar
      ? '<img src="' + chatUser.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
      : chatUser.username[0].toUpperCase();

    await this.loadMessages();

    if (this.messageInterval) clearInterval(this.messageInterval);
    this.messageInterval = setInterval(() => this.loadMessages(), 3000);
  },

  async loadMessages() {
    const user = AUTH.getSession();
    const chat = this.currentChat;
    if (!chat) return;

    try {
      const result = await DB.query(
        `SELECT m.id, m.sender_id, m.type, m.content, m.media_url, m.created_at
         FROM messages m
         WHERE (m.sender_id = :uid AND m.receiver_id = :cid)
            OR (m.sender_id = :cid AND m.receiver_id = :uid)
         ORDER BY m.created_at ASC`,
        [
          { name: "uid", value: { type: "text", value: user.id } },
          { name: "cid", value: { type: "text", value: chat.id } },
        ]
      );

      const container = document.getElementById("messages");
      const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      container.innerHTML = "";

      if (!result || result.rows.length === 0) {
        container.innerHTML = '<div class="empty-state">প্রথম message পাঠাও!</div>';
        return;
      }

      result.rows.forEach((row) => {
        const senderId = row[1];
        const type = row[2];
        const content = row[3];
        const mediaUrl = row[4];
        const time = new Date(row[5] * 1000).toLocaleTimeString("bn", {
          hour: "2-digit", minute: "2-digit",
        });
        const isSent = senderId === user.id;

        const msg = document.createElement("div");
        msg.className = "message " + (isSent ? "sent" : "received");

        let bubbleContent = "";
        if (type === "image" && mediaUrl) {
          bubbleContent = '<img src="' + mediaUrl + '" class="message-img" onclick="window.open(this.src)" />';
        } else if (type === "voice" && mediaUrl) {
          bubbleContent = '<audio controls src="' + mediaUrl + '"></audio>';
        } else if (type === "video" && mediaUrl) {
          bubbleContent = '<video controls src="' + mediaUrl + '" style="max-width:200px;border-radius:12px;"></video>';
        } else {
          bubbleContent = content;
        }

        msg.innerHTML = `
          <div class="message-bubble">
            ${bubbleContent}
            <div class="message-time">${time}</div>
          </div>`;
        container.appendChild(msg);
      });

      if (wasAtBottom) container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  },

  async sendMessage() {
    const user = AUTH.getSession();
    const chat = this.currentChat;
    const input = document.getElementById("msgInput");
    const content = input.value.trim();
    if (!content || !chat) return;

    input.value = "";

    await DB.query(
      "INSERT INTO messages (id, sender_id, receiver_id, type, content) VALUES (:id, :sid, :rid, 'text', :content)",
      [
        { name: "id", value: { type: "text", value: crypto.randomUUID() } },
        { name: "sid", value: { type: "text", value: user.id } },
        { name: "rid", value: { type: "text", value: chat.id } },
        { name: "content", value: { type: "text", value: content } },
      ]
    );

    await this.loadMessages();
    await this.loadChats();
  },

  async attachFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const user = AUTH.getSession();
      const chat = this.currentChat;
      if (!chat) return;

      try {
        const type = file.type.startsWith("image") ? "image" : "video";
        const url = await STORAGE.upload(file, type + "s");

        await DB.query(
          "INSERT INTO messages (id, sender_id, receiver_id, type, content, media_url) VALUES (:id, :sid, :rid, :type, :content, :url)",
          [
            { name: "id", value: { type: "text", value: crypto.randomUUID() } },
            { name: "sid", value: { type: "text", value: user.id } },
            { name: "rid", value: { type: "text", value: chat.id } },
            { name: "type", value: { type: "text", value: type } },
            { name: "content", value: { type: "text", value: file.name } },
            { name: "url", value: { type: "text", value: url } },
          ]
        );

        await this.loadMessages();
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    };
    input.click();
  },

  recordVoice() {
    alert("Voice — পরের step এ আসবে!");
  },

  showNewChat() {
    const username = prompt("Username লেখো:");
    if (!username) return;
    this.searchUser(username);
  },

  async searchUser(username) {
    try {
      const result = await DB.query(
        "SELECT id, username, avatar FROM users WHERE username = :username",
        [{ name: "username", value: { type: "text", value: username } }]
      );

      if (!result || result.rows.length === 0) {
        alert("User পাওয়া যায়নি!");
        return;
      }

      const row = result.rows[0];
      this.openChat({ id: row[0], username: row[1], avatar: row[2] });
    } catch (err) {
      alert("Error: " + err.message);
    }
  },

  search(query) {
    const items = document.querySelectorAll(".chat-item");
    items.forEach((item) => {
      const name = item.querySelector(".chat-name").textContent.toLowerCase();
      item.style.display = name.includes(query.toLowerCase()) ? "flex" : "none";
    });
  },

  switchTab(tab, el) {
    this.currentTab = tab;
    document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
    el.classList.add("active");
    if (tab === "chats") this.loadChats();
    else document.getElementById("chatList").innerHTML = '<div class="empty-state">শীঘ্রই আসছে!</div>';
  },
};

window.onload = () => APP.init();
