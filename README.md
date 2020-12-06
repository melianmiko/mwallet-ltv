mWallet-LTV (ПРОЕКТ ЗАКРЫТ)
==============
Красивый кошелёк для монет LeaderTV.

Установка
--------
Скачайте пакет для вашей системы:
https://gitlab.com/melianmiko/mwallet-ltv/-/releases/v0.1.4

Сборка из исходников
-------------------
Для сборки нужны `nodejs` и `npm`.
```bash
npm install       # Установить зависимости (выполняем в первую очередь)
```

Список вариантов сборки/запуска:
```bash
npm run start	  # Запустить без сборки
npm run dist	  # Собрать для текущей платформы
npm run dist-wl   # Собрать для Windows и Linux
npm run dist-apk  # Собрать для Android (нужен Android SDK)
npm run dist-all  # Собрать для Windows, Linux и Android
```

Отладка
--------
Для доступа к инструментам разработчика, нажмите Ctrl-D в окне программы.
