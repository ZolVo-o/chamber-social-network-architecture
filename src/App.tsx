import React, { useMemo, useState } from 'react';
import {
  AtSign,
  Bell,
  Check,
  Compass,
  Copy,
  Home,
  Image as ImageIcon,
  Lock,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

import { cn } from '@/utils/cn';

type UserRole = 'founder' | 'resident' | 'curator';

interface Message {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: UserRole;
    status?: string;
  };
  content: string;
  timestamp: Date;
  room: string;
  reactions: Record<string, number>;
  media?: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface OnlineUser {
  name: string;
  status: string;
  avatar: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
}

interface DemoProfile {
  name: string;
  username: string;
  avatar: string;
  status: string;
}

interface DeveloperAccount extends DemoProfile {
  inviteCode: string;
  specialCode: string;
}

const ROOMS: Room[] = [
  { id: 'plaza', name: 'Площадь', description: 'Главный хаб для всех', icon: <Home className="h-4 w-4" /> },
  { id: 'tech', name: 'Мастерская', description: 'Технологии и код', icon: <Zap className="h-4 w-4" /> },
  { id: 'art', name: 'Галерея', description: 'Дизайн и искусство', icon: <Compass className="h-4 w-4" /> },
  { id: 'offtopic', name: 'Курилка', description: 'Разговоры ни о чем', icon: <MessageSquare className="h-4 w-4" /> },
];

const ONLINE_USERS: OnlineUser[] = [
  { name: 'Александр', status: 'Curating thoughts', avatar: 'Alex' },
  { name: 'Мария', status: 'Design review', avatar: 'Mary' },
  { name: 'Дмитрий', status: 'WispByte expert', avatar: 'Dima' },
  { name: 'Елена', status: 'Reading...', avatar: 'Elena' },
  { name: 'Иван', status: 'Coding Centum', avatar: 'Ivan' },
  { name: 'Ольга', status: 'Voice note draft', avatar: 'Olga' },
  { name: 'Павел', status: 'Sketching flows', avatar: 'Pavel' },
  { name: 'София', status: 'Moderating plaza', avatar: 'Sofia' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Новая реакция', description: 'Мария отреагировала на твое сообщение в Площади.' },
  { id: '2', title: 'Комната ожила', description: 'В Мастерской появились новые сообщения.' },
  { id: '3', title: 'Инвайт подтвержден', description: 'Твой пропуск в Centum активен до конца цикла.' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    author: {
      name: 'Александр',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      role: 'founder',
      status: 'Building Centum',
    },
    content: 'Добро пожаловать в Centum. Нас ровно 100, и каждый голос здесь имеет вес. Это пространство для глубоких дискуссий, а не для шума.',
    timestamp: new Date(Date.now() - 3600000),
    room: 'plaza',
    reactions: { '✨': 12, '🤝': 5 },
  },
  {
    id: '2',
    author: {
      name: 'Мария',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary',
      role: 'resident',
    },
    content: 'Наконец-то соцсеть, где не чувствуешь себя в бесконечном потоке рекламы. Интерфейс просто кайф!',
    timestamp: new Date(Date.now() - 1800000),
    room: 'plaza',
    reactions: { '🔥': 8 },
  },
  {
    id: '3',
    author: {
      name: 'Дмитрий',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dima',
      role: 'curator',
    },
    content: 'Запустил новый проект на WispByte. Пинг минимальный, все летает. Кто-нибудь еще тестил их новые инстансы?',
    timestamp: new Date(Date.now() - 600000),
    room: 'tech',
    reactions: { '💻': 4, '🚀': 2 },
    media: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  resident: 'Resident',
  curator: 'Curator',
};

const QUICK_REACTIONS = ['❤️', '👏', '🔥', '✨'];
const DEMO_INVITE_CODES = ['CENTUM', 'CHAMBER', 'INVITE100'];
const SPECIAL_ACCESS_CODE = 'CHAMBER-2026';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'pending';
const DEVELOPER_ACCOUNT: DeveloperAccount = {
  name: 'Zol Vo',
  username: 'Zol_Vo',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zol_Vo',
  status: 'Разработчик в сети',
  inviteCode: 'CHAMBER',
  specialCode: SPECIAL_ACCESS_CODE,
};

const MessageCard = ({
  isOwn,
  isMenuOpen,
  message,
  onCopy,
  onDelete,
  onQuickReact,
  onToggleMenu,
  onToggleReaction,
}: {
  message: Message;
  isOwn: boolean;
  isMenuOpen: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onQuickReact: (messageId: string) => void;
  onToggleMenu: (messageId: string) => void;
  onCopy: (content: string) => void;
  onDelete: (messageId: string) => void;
}) => {
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
                <span className="text-xs text-white/30">• {format(message.timestamp, 'HH:mm')}</span>
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
            {Object.entries(message.reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(message.id, emoji)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 transition-colors hover:bg-white/10"
              >
                <span className="text-xs">{emoji}</span>
                <span className="text-xs font-medium text-white/60">{count}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onQuickReact(message.id)}
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
};

const UserLimitIndicator = ({ count }: { count: number }) => {
  const percentage = count;

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-white/60">Жители Centum</span>
        <span className="text-xs font-bold text-white/90">{count} / 100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full rounded-full bg-white/80" />
      </div>
      <p className="mt-2 text-center text-[10px] italic text-white/30">{100 - count} приглашений осталось в этом цикле</p>
    </div>
  );
};

const RoomItem = ({ room, active, onClick }: { room: Room; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all duration-200',
      active ? 'bg-white font-semibold text-black' : 'text-white/60 hover:bg-white/5 hover:text-white',
    )}
  >
    {room.icon}
    <span className="text-sm">{room.name}</span>
  </button>
);

export default function App() {
  const [activeRoom, setActiveRoom] = useState('plaza');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [specialCode, setSpecialCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageMenuId, setMessageMenuId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);
  const [composerImage, setComposerImage] = useState('');
  const [composerAttachment, setComposerAttachment] = useState('');
  const [showAllResidents, setShowAllResidents] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [profile, setProfile] = useState<DemoProfile | null>(null);

  const activeRoomData = ROOMS.find((room) => room.id === activeRoom) ?? ROOMS[0];
  const visibleResidents = showAllResidents ? ONLINE_USERS : ONLINE_USERS.slice(0, 5);
  const currentProfile = profile;
  const backendConfigured = BACKEND_URL !== 'pending';

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return messages.filter((message) => {
      if (message.room !== activeRoom) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [message.content, message.author.name, message.author.status ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeRoom, messages, searchQuery]);

  const handleJoin = () => {
    const normalizedName = displayName.trim();
    const normalizedUsername = username.trim().replace(/^@+/, '');
    const normalizedCode = inviteCode.trim().toUpperCase();
    const normalizedSpecialCode = specialCode.trim().toUpperCase();

    if (!normalizedName || normalizedName.length < 2) {
      setInviteError('Укажи имя минимум из 2 символов.');
      return;
    }

    if (!normalizedUsername || normalizedUsername.length < 3) {
      setInviteError('Нужен юзернейм минимум из 3 символов.');
      return;
    }

    if (!normalizedCode) {
      setInviteError('Введи код приглашения. Для демо можно использовать CENTUM.');
      return;
    }

    if (!DEMO_INVITE_CODES.includes(normalizedCode)) {
      setInviteError('Код не найден. Попробуй CENTUM, CHAMBER или INVITE100.');
      return;
    }

    if (normalizedSpecialCode !== SPECIAL_ACCESS_CODE) {
      setInviteError('Нужен специальный код доступа. Для демо используй CHAMBER-2026.');
      return;
    }

    setInviteError('');
    setProfile({
      name: normalizedName,
      username: normalizedUsername,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedUsername)}`,
      status: 'В сети сейчас',
    });
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        title: 'Регистрация завершена',
        description: `Профиль @${normalizedUsername} успешно активирован в Centum.`,
      },
      ...prev,
    ]);
    setHasUnreadNotifications(true);
    setIsJoined(true);
  };

  const handleDeveloperAccount = () => {
    setDisplayName(DEVELOPER_ACCOUNT.name);
    setUsername(DEVELOPER_ACCOUNT.username);
    setInviteCode(DEVELOPER_ACCOUNT.inviteCode);
    setSpecialCode(DEVELOPER_ACCOUNT.specialCode);
    setInviteError('');
    setProfile({
      name: DEVELOPER_ACCOUNT.name,
      username: DEVELOPER_ACCOUNT.username,
      avatar: DEVELOPER_ACCOUNT.avatar,
      status: DEVELOPER_ACCOUNT.status,
    });
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        title: 'Аккаунт разработчика активирован',
        description: `Добро пожаловать, @${DEVELOPER_ACCOUNT.username}. Панель разработки готова к работе.`,
      },
      ...prev,
    ]);
    setHasUnreadNotifications(true);
    setIsJoined(true);
  };

  const handleSendMessage = (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!currentProfile) {
      return;
    }

    const content = newMessage.trim();
    if (!content && !composerImage && !composerAttachment) {
      return;
    }

    const message: Message = {
      id: crypto.randomUUID(),
      author: {
        name: currentProfile.name,
        avatar: currentProfile.avatar,
        role: 'resident',
        status: currentProfile.status,
      },
      content: composerAttachment ? `${content}${content ? '\n\n' : ''}Вложение: ${composerAttachment}` : content || 'Отправлено изображение',
      timestamp: new Date(),
      room: activeRoom,
      reactions: {},
      media: composerImage || undefined,
    };

    setMessages((prev) => [message, ...prev]);
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        title: 'Сообщение отправлено',
        description: `Твое сообщение появилось в комнате «${activeRoomData.name}».`,
      },
      ...prev,
    ]);
    setHasUnreadNotifications(true);
    setNewMessage('');
    setComposerImage('');
    setComposerAttachment('');
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: {
                ...message.reactions,
                [emoji]: (message.reactions[emoji] ?? 0) + 1,
              },
            }
          : message,
      ),
    );
  };

  const handleQuickReaction = (messageId: string) => {
    const randomReaction = QUICK_REACTIONS[Math.floor(Math.random() * QUICK_REACTIONS.length)];
    handleToggleReaction(messageId, randomReaction);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setMessageMenuId(null);
    } catch {
      window.alert('Не удалось скопировать текст в буфер обмена.');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
    setMessageMenuId(null);
  };

  const handleInsertEmoji = () => {
    setNewMessage((prev) => `${prev}${prev ? ' ' : ''}✨`);
  };

  const handleInsertMention = () => {
    setNewMessage((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@`);
  };

  const handleAttachFile = () => {
    const attachmentName = window.prompt('Как назвать вложение?', composerAttachment || 'brief.pdf');

    if (!attachmentName) {
      return;
    }

    setComposerAttachment(attachmentName.trim());
  };

  const handleAttachImage = () => {
    const imageUrl = window.prompt('Вставь ссылку на изображение', composerImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80');

    if (!imageUrl) {
      return;
    }

    setComposerImage(imageUrl.trim());
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setHasUnreadNotifications(false);
  };

  const openRoom = (roomId: string) => {
    setActiveRoom(roomId);
    setMobileNavOpen(false);
  };

  const mobileOverlayVisible = mobileNavOpen || mobileCommunityOpen;

  if (!isJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 rotate-12 items-center justify-center rounded-[2rem] bg-white text-black">
              <Lock className="h-10 w-10" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight">Centum</h1>
            <p className="mb-8 leading-relaxed text-white/50">
              Камерная социальная сеть на 100 человек.
              <br />
              Вход только по приглашениям. Качество важнее количества.
            </p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  placeholder="Твое имя"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  placeholder="Юзернейм"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(event) => {
                    setInviteCode(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleJoin();
                    }
                  }}
                  placeholder="Код приглашения"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={specialCode}
                  onChange={(event) => {
                    setSpecialCode(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleJoin();
                    }
                  }}
                  placeholder="Специальный код доступа"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center transition-all placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              {inviteError && <p className="text-sm text-red-300">{inviteError}</p>}
              <button
                type="button"
                onClick={handleJoin}
                className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-all hover:bg-white/90 active:scale-95"
              >
                Создать демо-профиль
              </button>
              <button
                type="button"
                onClick={handleDeveloperAccount}
                className="w-full rounded-2xl border border-white/15 bg-white/5 py-4 font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Войти как разработчик Zol_Vo
              </button>
            </div>
            <p className="mt-4 text-xs text-white/30">Демо-коды: CENTUM, CHAMBER, INVITE100 • спецкод: CHAMBER-2026</p>
          </motion.div>
          <div className="flex justify-center gap-4">
            <UserLimitIndicator count={87} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#09090b] text-white">
      {mobileOverlayVisible && <button type="button" className="absolute inset-0 z-30 bg-black/60 xl:hidden" onClick={() => {
        setMobileNavOpen(false);
        setMobileCommunityOpen(false);
      }} aria-label="Закрыть боковые панели" />}

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

        <UserLimitIndicator count={88} />

        <div className="mb-10 space-y-1">
          <div className="mb-2 px-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Навигация</span>
          </div>
          {ROOMS.map((room) => (
            <RoomItem key={room.id} room={room} active={activeRoom === room.id} onClick={() => openRoom(room.id)} />
          ))}
        </div>

        <div className="relative mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
            <img src={currentProfile.avatar} className="h-8 w-8 rounded-full" alt={currentProfile.name} />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">{currentProfile.name}</p>
              <p className="truncate text-[10px] italic text-white/40">@{currentProfile.username}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="rounded-full p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Открыть настройки профиля"
            >
              <Settings className="h-4 w-4" />
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
                <Check className="h-4 w-4" />
                Сбросить поиск
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsJoined(false);
                  setProfile(null);
                  setDisplayName('');
                  setUsername('');
                  setInviteCode('');
                  setSpecialCode('');
                  setInviteError('');
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Lock className="h-4 w-4" />
                Вернуться к экрану входа
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-[#0c0c0e] to-[#09090b]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0c0ee6] backdrop-blur-md">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
                aria-label="Открыть навигацию"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold sm:text-xl">
                  {activeRoomData.name}
                  <span className="hidden text-xs font-normal text-white/30 sm:inline">{activeRoomData.description}</span>
                </h2>
                <p className="text-xs text-white/35 sm:hidden">{activeRoomData.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск по Centum..."
                  className="w-56 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 lg:w-64"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative rounded-full p-2 transition-colors hover:bg-white/5"
                  aria-label="Открыть уведомления"
                >
                  <Bell className="h-5 w-5 text-white/60" />
                  {hasUnreadNotifications && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#09090b] bg-red-500"></span>}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 z-30 w-[18rem] rounded-2xl border border-white/10 bg-[#111114] p-3 shadow-2xl shadow-black/40 sm:w-80">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-white/90">Уведомления</p>
                      <button
                        type="button"
                        onClick={() => setNotifications([])}
                        className="text-xs text-white/40 transition-colors hover:text-white/70"
                      >
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
              <button
                type="button"
                onClick={() => setMobileCommunityOpen(true)}
                className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white xl:hidden"
                aria-label="Открыть панель сообщества"
              >
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
            <AnimatePresence initial={false}>
              {filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isOwn={message.author.name === currentProfile?.name}
                  isMenuOpen={messageMenuId === message.id}
                  onToggleReaction={handleToggleReaction}
                  onQuickReact={handleQuickReaction}
                  onToggleMenu={(messageId) => setMessageMenuId((prev) => (prev === messageId ? null : messageId))}
                  onCopy={handleCopyMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}
            </AnimatePresence>

            {filteredMessages.length === 0 && (
              <div className="py-20 text-center">
                <p className="italic text-white/20">
                  {searchQuery ? 'Ничего не найдено. Попробуй другой запрос.' : 'Здесь пока пусто. Стань первым, кто нарушит тишину.'}
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
                <button
                  type="button"
                  onClick={() => {
                    setComposerAttachment('');
                    setComposerImage('');
                  }}
                  className="rounded-full px-3 py-1 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Очистить
                </button>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-3 transition-all focus-within:border-white/20 focus-within:bg-white/[0.07] sm:p-4"
            >
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Что на уме, житель ${activeRoom === 'plaza' ? 'Площади' : 'комнаты'}?`}
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
                  disabled={!newMessage.trim() && !composerImage && !composerAttachment}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                >
                  <Send className="h-4 w-4" />
                  Опубликовать
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
            В сети
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          </h3>
          <button type="button" onClick={() => setMobileCommunityOpen(false)} className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-white xl:hidden" aria-label="Закрыть панель сообщества">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {visibleResidents.map((user) => (
            <button key={user.name} type="button" onClick={() => setNewMessage((prev) => `${prev}${prev ? ' ' : ''}@${user.name}`)} className="group flex w-full items-center gap-3 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-white/5">
              <div className="relative shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                  className="h-10 w-10 rounded-full border border-white/10 transition-colors group-hover:border-white/30"
                  alt={user.name}
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#09090b] bg-green-500"></div>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">{user.name}</p>
                <p className="truncate text-[11px] italic text-white/30">{user.status}</p>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAllResidents((prev) => !prev)}
            className="w-full pt-2 text-[11px] font-bold uppercase tracking-widest text-white/20 transition-colors hover:text-white/40"
          >
            {showAllResidents ? 'Скрыть часть жителей' : 'Показать всех жителей'}
          </button>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
            <Lock className="h-3 w-3" /> Статус системы
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Backend (WispByte)</span>
              <span className={cn('text-[11px] font-bold', backendConfigured ? 'text-green-400' : 'text-amber-300')}>
                {backendConfigured ? 'Configured' : 'Pending URL'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Uptime</span>
              <span className="text-[11px] text-white/70">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">Slots</span>
              <span className="text-[11px] text-white/70">88/100</span>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="mb-1 text-[11px] font-medium text-white/40">Server URL</p>
              <p className="break-all text-[11px] text-white/70">
                {backendConfigured ? BACKEND_URL : 'Укажи VITE_API_BASE_URL в .env.local'}
              </p>
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
