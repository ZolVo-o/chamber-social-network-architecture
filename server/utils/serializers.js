export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    avatar: user.avatar_url,
    createdAt: user.created_at,
  };
}

export function serializeMessage(row) {
  return {
    id: String(row.id),
    room: row.room_id,
    content: row.content,
    media: row.media_url || undefined,
    timestamp: row.created_at,
    author: {
      id: row.user_id,
      name: row.name,
      username: row.username,
      role: row.role,
      status: row.status,
      avatar: row.avatar_url,
    },
  };
}
