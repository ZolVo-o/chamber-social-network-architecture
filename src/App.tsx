import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AtSign,
  Bell,
  Compass,
  Copy,
  Home,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

import { API_BASE_URL, BACKEND_CONFIGURED } from '@/config';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api';
import { cn } from '@/utils/cn';

type UserRole = 'founder' | 'resident' | 'curator';
type AuthMode = 'register' | 'login';

interface Room {
  id: string;
  name: string;
  description: string;
}

interface Profile {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  status: string;
  avatar: string;
  createdAt: string;
}

interface Message {
  id: string;
  room: string;
  content: string;
  media?: string;
  timestamp: string;
  author: {
    id: number;
    name: string;
    username: string;
    role: UserRole;
    status?: string;
    avatar: string;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
}

interface AuthResponse {
  token: string;
  user: Profile;
}

interface SystemStatus {
  status: string;
  userCount: number;
  messageCount: number;
  roomCount: number;
}

const ROOM_ICONS: Record<string, ReactNode> = {
  plaza: <Home className="h-4 w-4" />,
  tech: <Zap className="h-4 w-4" />,
  art: <Compass className="h-4 w-4" />,
  offtopic: <MessageSquare className="h-4 w-4" />,
};

const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  resident: 'Resident',
  curator: 'Curator',
};

const QUICK_REACTIONS = ['❤️', '👏', '🔥', '✨'];
const DEVELOPER_ACCOUNT = {
  name: 'Zol Vo',
  username: 'Zol_Vo',
  password: 'ZV_dev_2026',
  inviteCode: 'CHAMBER',
  specialCode: 'CHAMBER-2026',
};

function createNotification(title: string, description: string): NotificationItem {
  return {
    id: crypto.randomUUID(),
    title,
    description,
  };
}

function UserLimitIndicator({ count }: { count: number }) {
  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-white/60">Жители Centum</span>
        <span className="text-xs font-bold text-white/90">{count} / 100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${count}%` }} className="h-full rounded-full bg-white/80" />
      </div>
      <p className="mt-2 text-center text-[10px] italic text-white/30">{100 - count} приглашений осталось в этом цикле</p>
    </div>
  );
}

function RoomItem({ room, active, onClick }: { room: Room; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all duration-200',
        active ? 'bg-white font-semibold text-black' : 'text-white/60 hover:bg-white/5 hover:text-white',
      )}
    >
      {ROOM_ICONS[room.id] ?? <MessageSquare className="h-4 w-4" />}
      <span className="text-sm">{room.name}</span>
    </button>
  );
}

function MessageCard({
  message,
  isOwn,
  isMenuOpen,
  onToggleMenu,
  onDelete,
  onCopy,
  onQuickReact,
}: {
  message: Message;
  isOwn: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onCopy: (content: string) => void;
  onQuickReact: (messageId: string) => void;
}) {
  const [localReactions, setLocalReactions] = useState<Record<string, number>>({});

  const mergedReactions = useMemo(() => {
    const base = Object.fromEntries(QUICK_REACTIONS.map((emoji) => [emoji, 0]));
    return { ...base, ...localReactions };
  }, [localReactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/[0.07] sm:p-5"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <img src={message.author.avatar} alt={message.author.name} className="h-10 w-10 rounded-full border border-white/20 sm:h-12 sm:w-12" />
          {message.author.role === 'founder' && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#09090b] bg-yellow-500">
              <span className="text-[8px] font-bold text-black">F</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white/90">{message.author.name}</span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {ROLE_LABELS[message.author.role]}
                </span>
                <span className="text-xs text-white/30">• {format(new Date(message.timestamp), 'HH:mm')}</span>
              </div>
              {message.author.status && <p className="mt-1 text-[11px] italic text-white/35">{message.author.status}</p>}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => onToggleMenu(message.id)}
                className="rounded-full p-1 transition-opacity hover:bg-white/10 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Открыть меню сообщения"
              >
                <MoreHorizontal className="h-4 w-4 text-white/50" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/40">
                  <button
                    type="button"
                    onClick={() => onCopy(message.content)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                    Скопировать текст
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    disabled={!isOwn}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить сообщение
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80 sm:text-base">{message.content}</p>

          {message.media && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img src={message.media} alt="Вложение к сообщению" className="max-h-80 w-full object-cover" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
            {Object.entries(mergedReactions)
              .filter(([, count]) => count > 0)
              .map(([emoji, count]) => (
                <button key={emoji} type="button" className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                  <span className="text-xs">{emoji}</span>
                  <span className="text-xs font-medium text-white/60">{count}</span>
                </button>
              ))}
            <button
              type="button"
              onClick={() => {
                const emoji = QUICK_REACTIONS[Math.floor(Math.random() * QUICK_REACTIONS.length)];
                setLocalReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
                onQuickReact(message.id);
              }}
              className="rounded-lg border border-transparent p-1.5 text-white/30 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white/60"
              aria-label="Быстрая реакция"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [activeRoom, setActiveRoom] = useState('plaza');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [specialCode, setSpecialCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [chatError, setChatError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composerImage, setComposerImage] = useState('');
  const [composerAttachment, setComposerAttachment] = useState('');

  const activeRoomData = rooms.find((room) => room.id === activeRoom) ?? rooms[0];
  const isJoined = profile !== null;
  const userCount = systemStatus?.userCount ?? 0;

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return messages.filter((message) => {
      if (message.room !== activeRoom) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [message.content, message.author.name, message.author.username, message.author.status ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeRoom, messages, searchQuery]);

  useEffect(() => {
    void bootstrap();
    void loadSystemStatus();
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    void loadRooms();
    void loadSystemStatus();
  }, [profile]);

  useEffect(() => {
    if (!profile || !activeRoom) {
      return;
    }

    void loadMessages(activeRoom);

    const interval = window.setInterval(() => {
      void loadMessages(activeRoom, false);
      void loadSystemStatus();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeRoom, profile]);

  async function bootstrap() {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest<{ user: Profile }>('/api/auth/me');
      setProfile(response.user);
    } catch {
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  }

  async function loadSystemStatus() {
    try {
      const response = await apiRequest<SystemStatus>('/api/system/status');
      setSystemStatus(response);
    } catch {
      // Keep silent in UI for now; server URL card already communicates readiness.
    }
  }

  async function loadRooms() {
    try {
      const response = await apiRequest<{ rooms: Room[] }>('/api/rooms');
      setRooms(response.rooms);
      if (!response.rooms.some((room) => room.id === activeRoom)) {
        setActiveRoom(response.rooms[0]?.id ?? 'plaza');
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Не удалось загрузить комнаты.');
    }
  }

  async function loadMessages(roomId: string, showError = true) {
    try {
      const response = await apiRequest<{ messages: Message[] }>(`/api/rooms/${roomId}/messages`);
      setMessages(response.messages);
      if (showError) {
        setChatError('');
      }
    } catch (error) {
      if (showError) {
        setChatError(error instanceof Error ? error.message : 'Не удалось загрузить сообщения.');
      }
    }
  }

  async function handleAuthSubmit() {
    setAuthSubmitting(true);
    setAuthError('');

    try {
      const payload =
        authMode === 'register'
          ? { name: displayName, username, password, inviteCode, specialCode }
          : { username, password };

      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await apiRequest<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setAuthToken(response.token);
      setProfile(response.user);
      setNotifications((prev) => [
        createNotification(
          authMode === 'register' ? 'Регистрация завершена' : 'Вход выполнен',
          `Добро пожаловать, @${response.user.username}.`,
        ),
        ...prev,
      ]);
      setHasUnreadNotifications(true);
      setLoading(false);
      setPassword('');
      setAuthError('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось выполнить авторизацию.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleDeveloperFill() {
    setAuthMode('login');
    setDisplayName(DEVELOPER_ACCOUNT.name);
    setUsername(DEVELOPER_ACCOUNT.username);
    setPassword(DEVELOPER_ACCOUNT.password);
    setInviteCode(DEVELOPER_ACCOUNT.inviteCode);
    setSpecialCode(DEVELOPER_ACCOUNT.specialCode);
    setAuthError('');
  }

  async function handleSendMessage(event?: React.FormEvent) {
    event?.preventDefault();

    const content = newMessage.trim();
    if (!content && !composerImage && !composerAttachment) {
      return;
    }

    setMessageSubmitting(true);
    setChatError('');

    try {
      const response = await apiRequest<{ message: Message }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          roomId: activeRoom,
          content: composerAttachment ? `${content}${content ? '\n\n' : ''}Вложение: ${composerAttachment}` : content || 'Отправлено изображение',
          mediaUrl: composerImage || undefined,
        }),
      });

      setMessages((prev) => [response.message, ...prev.filter((item) => item.id !== response.message.id)]);
      setNotifications((prev) => [
        createNotification('Сообщение отправлено', `Твое сообщение появилось в комнате «${activeRoomData?.name ?? activeRoom}».`),
        ...prev,
      ]);
      setHasUnreadNotifications(true);
      setNewMessage('');
      setComposerImage('');
      setComposerAttachment('');
      void loadSystemStatus();
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Не удалось отправить сообщение.');
    } finally {
      setMessageSubmitting(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      await apiRequest<void>(`/api/messages/${messageId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      setMessageMenuId(null);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Не удалось удалить сообщение.');
    }
  }

  async function handleCopyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setMessageMenuId(null);
    } catch {
      window.alert('Не удалось скопировать текст в буфер обмена.');
    }
  }

  function handleLogout() {
    clearAuthToken();
    setProfile(null);
    setRooms([]);
    setMessages([]);
    setNotifications([]);
    setHasUnreadNotifications(false);
    setAuthMode('login');
    setPassword('');
    setIsProfileMenuOpen(false);
    setLoading(false);
  }

  function toggleNotifications() {
    setIsNotificationsOpen((prev) => !prev);
    setHasUnreadNotifications(false);
  }

  function handleAttachFile() {
    const attachmentName = window.prompt('Как назвать вложение?', composerAttachment || 'brief.pdf');
    if (attachmentName) {
      setComposerAttachment(attachmentName.trim());
    }
  }

  function handleAttachImage() {
    const imageUrl = window.prompt('Вставь ссылку на изображение', composerImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80');
    if (imageUrl) {
      setComposerImage(imageUrl.trim());
    }
  }

  function handleInsertEmoji() {
    setNewMessage((prev) => `${prev}${prev ? ' ' : ''}✨`);
  }

  function handleInsertMention() {
    setNewMessage((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@`);
  }

  const mobileOverlayVisible = mobileNavOpen || mobileCommunityOpen;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex items-center gap-3 text-white/70">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Подключение к Centum...
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 rotate-12 items-center justify-center rounded-[2rem] bg-white text-black">
              {authMode === 'register' ? <UserPlus className="h-10 w-10" /> : <Lock className="h-10 w-10" />}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight">Centum</h1>
            <p className="mb-8 leading-relaxed text-white/50">
              Камерная социальная сеть на 100 человек.
              <br />
              Реальная регистрация и настоящий backend уже подключены.
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={cn('rounded-xl px-4 py-3 text-sm font-medium transition-colors', authMode === 'register' ? 'bg-white text-black' : 'text-white/60 hover:text-white')}
              >
                Регистрация
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={cn('rounded-xl px-4 py-3 text-sm font-medium transition-colors', authMode === 'login' ? 'bg-white text-black' : 'text-white/60 hover:text-white')}
              >
                Вход
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'register' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Твое имя"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Юзернейм"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              )}

              {authMode === 'login' && (
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Юзернейм"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              )}

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Пароль"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              />

              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="Код приглашения"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <input
                    type="text"
                    value={specialCode}
                    onChange={(event) => setSpecialCode(event.target.value)}
                    placeholder="Специальный код доступа"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </>
              )}

              {authError && <p className="text-sm text-red-300">{authError}</p>}

              <button
                type="button"
                onClick={() => void handleAuthSubmit()}
                disabled={authSubmitting || !BACKEND_CONFIGURED}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-black transition-all hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {authMode === 'register' ? 'Создать аккаунт' : 'Войти'}
              </button>

              <button
                type="button"
                onClick={handleDeveloperFill}
                className="w-full rounded-2xl border border-white/15 bg-white/5 py-4 font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Заполнить данные разработчика
              </button>
            </div>

            <p className="mt-4 text-xs text-white/30">
              {BACKEND_CONFIGURED ? `Сервер: ${API_BASE_URL}` : 'Сначала укажи VITE_API_BASE_URL'}
            </p>
          </motion.div>

          <div className="flex justify-center gap-4">
            <UserLimitIndicator count={userCount} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#09090b] text-white">
      {mobileOverlayVisible && (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-black/60 xl:hidden"
          onClick={() => {
            setMobileNavOpen(false);
            setMobileCommunityOpen(false);
          }}
          aria-label="Закрыть боковые панели"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-white/10 bg-[#09090b] p-6 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center justify-between gap-3 px-2 lg:mb-10 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-black text-black">C</div>
            <span className="text-xl font-bold tracking-tight">Centum</span>
          </div>
          <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Закрыть меню">
            <X className="h-5 w-5" />
          </button>
        </div>

        <UserLimitIndicator count={userCount} />

        <div className="mb-10 space-y-1">
          <div className="mb-2 px-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Навигация</span>
          </div>
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              active={activeRoom === room.id}
              onClick={() => {
                setActiveRoom(room.id);
                setMobileNavOpen(false);
              }}
            />
          ))}
        </div>

        <div className="relative mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
            <img src={profile.avatar} className="h-8 w-8 rounded-full" alt={profile.name} />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">{profile.name}</p>
              <p className="truncate text-[10px] italic text-white/40">@{profile.username}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="rounded-full p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Открыть настройки профиля"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {isProfileMenuOpen && (
            <div className="absolute bottom-20 left-0 right-0 rounded-2xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/40">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Search className="h-4 w-4" />
                Сбросить поиск
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-[#0c0c0e] to-[#09090b]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0c0ee6] backdrop-blur-md">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Открыть навигацию">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold sm:text-xl">
                  {activeRoomData?.name ?? 'Комната'}
                  <span className="hidden text-xs font-normal text-white/30 sm:inline">{activeRoomData?.description ?? 'Выбери комнату'}</span>
                </h2>
                <p className="text-xs text-white/35 sm:hidden">{activeRoomData?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск по сообщениям"
                  className="w-56 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 lg:w-64"
                />
              </div>
              <div className="relative">
                <button type="button" onClick={toggleNotifications} className="relative rounded-full p-2 transition-colors hover:bg-white/5" aria-label="Открыть уведомления">
                  <Bell className="h-5 w-5 text-white/60" />
                  {hasUnreadNotifications && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#09090b] bg-red-500"></span>}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 z-30 w-[18rem] rounded-2xl border border-white/10 bg-[#111114] p-3 shadow-2xl shadow-black/40 sm:w-80">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-white/90">Уведомления</p>
                      <button type="button" onClick={() => setNotifications([])} className="text-xs text-white/40 transition-colors hover:text-white/70">
                        Очистить
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="rounded-2xl border border-white/5 bg-white/5 p-3">
                            <p className="text-sm font-medium text-white/85">{notification.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/45">{notification.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/35">Новых уведомлений пока нет.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setMobileCommunityOpen(true)} className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white xl:hidden" aria-label="Открыть панель сообщества">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 md:hidden sm:px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск по сообщениям"
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {chatError && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{chatError}</div>}

            <AnimatePresence initial={false}>
              {filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isOwn={message.author.id === profile.id}
                  isMenuOpen={messageMenuId === message.id}
                  onToggleMenu={(messageId) => setMessageMenuId((prev) => (prev === messageId ? null : messageId))}
                  onDelete={(messageId) => void handleDeleteMessage(messageId)}
                  onCopy={(content) => void handleCopyMessage(content)}
                  onQuickReact={() => undefined}
                />
              ))}
            </AnimatePresence>

            {filteredMessages.length === 0 && (
              <div className="py-20 text-center">
                <p className="italic text-white/20">
                  {searchQuery ? 'Ничего не найдено. Попробуй другой запрос.' : 'Пока здесь пусто. Отправь первое сообщение в эту комнату.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {(composerAttachment || composerImage) && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                {composerAttachment && <span className="rounded-full border border-white/10 px-3 py-1">Файл: {composerAttachment}</span>}
                {composerImage && <span className="rounded-full border border-white/10 px-3 py-1">Изображение прикреплено</span>}
                <button type="button" onClick={() => {
                  setComposerAttachment('');
                  setComposerImage('');
                }} className="rounded-full px-3 py-1 text-white/50 transition-colors hover:bg-white/5 hover:text-white">
                  Очистить
                </button>
              </div>
            )}

            <form onSubmit={(event) => void handleSendMessage(event)} className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-3 transition-all focus-within:border-white/20 focus-within:bg-white/[0.07] sm:p-4">
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={`Что на уме, житель ${activeRoomData?.name ?? 'Centum'}?`}
                className="min-h-[60px] w-full resize-none border-none bg-transparent px-3 py-2 text-white/90 placeholder:text-white/20 focus:ring-0"
              />

              {composerImage && (
                <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src={composerImage} alt="Предпросмотр вложенного изображения" className="max-h-56 w-full object-cover" />
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-white/5 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" onClick={handleAttachImage} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70" aria-label="Прикрепить изображение">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={handleAttachFile} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70" aria-label="Прикрепить файл">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={handleInsertEmoji} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70" aria-label="Добавить эмодзи">
                    <Smile className="h-5 w-5" />
                  </button>
                  <div className="mx-1 hidden h-4 w-px bg-white/10 sm:block"></div>
                  <button type="button" onClick={handleInsertMention} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70" aria-label="Добавить упоминание">
                    <AtSign className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={messageSubmitting || (!newMessage.trim() && !composerImage && !composerAttachment)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                >
                  {messageSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Отправить
                </button>
              </div>
            </form>
            <p className="mt-3 text-center text-[10px] text-white/20">Enter — отправить • Shift+Enter — новая строка</p>
          </div>
        </div>
      </main>

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-80 flex-col overflow-y-auto border-l border-white/10 bg-[#09090b] p-6 transition-transform duration-300 xl:static xl:z-auto xl:translate-x-0',
          mobileCommunityOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between gap-3 px-2">
          <h3 className="flex items-center justify-between gap-2 text-sm font-bold text-white/90">
            В системе
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">{userCount}</span>
          </h3>
          <button type="button" onClick={() => setMobileCommunityOpen(false)} className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-white xl:hidden" aria-label="Закрыть панель сообщества">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-relaxed text-white/35">
          Сейчас онлайн-присутствие ещё не реализовано через real-time, но backend уже хранит пользователей, комнаты и сообщения.
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
            <Lock className="h-3 w-3" /> Статус системы
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Backend (WispByte)</span>
              <span className={cn('text-[11px] font-bold', BACKEND_CONFIGURED ? 'text-green-400' : 'text-amber-300')}>
                {BACKEND_CONFIGURED ? 'Configured' : 'Pending URL'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Комнат</span>
              <span className="text-[11px] text-white/70">{systemStatus?.roomCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Сообщений</span>
              <span className="text-[11px] text-white/70">{systemStatus?.messageCount ?? 0}</span>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="mb-1 text-[11px] font-medium text-white/40">Server URL</p>
              <p className="break-all text-[11px] text-white/70">{BACKEND_CONFIGURED ? API_BASE_URL : 'Укажи VITE_API_BASE_URL в .env.local или переменных окружения'}</p>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="mb-1 text-[11px] font-medium text-white/40">API readiness</p>
              <p className="text-[11px] text-white/70">Регистрация, логин, комнаты, загрузка и отправка сообщений уже работают через backend.</p>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 text-center text-[10px] leading-relaxed text-white/20">
          &copy; 2026 Centum.
          <br />
          Host provided by WispByte.
          <br />
          Your voice matters.
        </div>
      </aside>
    </div>
  );
}
