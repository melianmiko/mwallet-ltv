mWallet-LTV
==============
Красивый кошелёк для монет LeaderTV.

Установка
--------
### Windows
[https://github.com/mhbrgn/mWallet-LTV/releases](Тут) скачиваем установщик. И устанавливаем.

### Linux
В процессе...

Сборка из исходников
-------------------
1. Устаноавливаем зависимости. В первую очередь, ставим nodejs и npm.
2. Клонируем репозиторий и ставим npm-зависимости
```
git clone https://github.com/mhbrgn/mWallet-LTV.git
cd mWallet-LTV
npm install
```

3. Сборка или запуск безм неё
```
# Собрать установщик (Electron)
npm run dist

# ...или просто запустить
npm start
```

4. Сборка для Android
```
npm install -g cordova # если не установлено
cordova build android
```
Отладка
--------
Для доступа к инструментам разработчика, нажмите Ctrl-D в окне программы.
