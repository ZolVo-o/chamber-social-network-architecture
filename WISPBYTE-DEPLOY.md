# Deploy на WispByte

## Что загружать на хост

Загружай весь проект **кроме**:

- `node_modules/`
- `dist/`

Они уже добавлены в `.gitignore`.

## Docker image

Рекомендуется выбрать:

- `nodejs_22`

Если его нет или хочешь новее, можно `nodejs_24`.

## Startup command

Вставь в редактор команд WispByte вот эту команду:

```bash
if [[ -d .git ]] && [[ ${AUTO_UPDATE} == "1" ]]; then git pull; fi; /usr/local/bin/npm install --include=dev && /usr/local/bin/npm run build && /usr/local/bin/npm run start
```

## Переменные окружения

Тебе нужен файл `.env.local` в корне проекта.

Сейчас для твоего сервера используется:

```env
VITE_API_BASE_URL=http://87.106.190.187:10906
```

Если адрес потом изменится, просто поменяй это значение.

## Как запускать

1. Выбери `nodejs_22`
2. Сохрани startup command
3. Загрузи проект
4. Убедись, что `.env.local` лежит в корне
5. Перезапусти сервер

## Что должно быть в логах

Нормальный запуск выглядит примерно так:

- `npm install --include=dev`
- `vite build`
- `Centum server listening on port ...`

## Проверка после запуска

Открой:

- основной сайт: `http://87.106.190.187:10906`
- health-check: `http://87.106.190.187:10906/health`

Если `/health` отвечает `{"status":"ok"}`, значит сервер поднялся.
