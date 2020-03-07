window.appLocale = {
	localeInfo: {
		// Put translators credits here
		author: "Michael B",
		donateLink: null
	},
	fwSettings: {
		apply: "Применить и перезапустить",
		darkTheme: "Тёмная тема",
		bigMode: "Крупный шрифт",
		restartRequired: "Для применения изменений приложение будет перезапущено",
		titleColorAccent: "Цвет оформления",
		customColor: "Свой цвет"
	},
	electron: {
		dataSelect_title: "Где хранить монеты?",
		setup_title: "Создание кошелька",
		action_create: "Создать новый",
		action_restore: "Восстановить из бэкапа",
		action_back: "Выбрать другую папку",
		recomentPath: "Рекомендуемая папка",
		prop_load_peers: "Загрузить список пиров с cryptoid.info?",
		prop_load_peers_info: "Это сделает первый запуск более быстрым",
		selectPath: "Выбрать папку...",
		alert_nolatin_path: "Путь к папке не может содержать русские символы. Выберите другую папку либо используйте рекомендуемую.",
		cfg_resetPath: "Изменить папку кошелька",
		cfg_stopOnExit: "Отключить фоновый режим",
		group_cfg: "Параметры",
		group_etc: "Прочее",
		setup_info: "В указаной папке нет файла wallet.dat, значит в ней нет файлов кошелька. Хотите создать новый кошелёк или восстановить существующий?",
		dataSelect_info: "Выберите папку для хранения данных кошелька. Если вы уже использовали "+
			"оригинальное приложение, вы можете выбрать его папку данных кошелька. <b>Важно: к одному "+
			"кошельку не может подключиться два приложения, и для загрузки данных родного кошелька, его"+
			" приложение нужно закрыть!</b>",
		stopOnExit_notice: "Если эта галочка отмечена, кошелёк будет полностью завершаться при закрытии окна. "+
			"При этом не будет работать фоновый майнинг и автосинхринизация, а запуск приложения будет занимать больше времени. "+
			"Однако это значительно снижает риск повреждения кошелька при непредвиденном отключении питания. Если вы используете ноутбук, лучше "+
			"включите эту опцию."
	},
	launcher: {
		cancel: "Отмена",
		stage_platform: "Запуск...",
		stage_findWallet: "Поиск кошелька...",
		stage_loadWallet: "Запуск кошелька...",
		wallet_native: "Локальный кошелёк",
		wallets_editButton: "Настройки",
		wallets_other: "Другие аккаунты",
		wallets_selectScreenTitle: "Выбор кошелька",
		editor_title: "Управление кошельками",
		editor_newWallet: "Создать кошелёк",
		editor_walletsSubtitle: "Ваши аккаунты",
		editor_rename: "Переименовать",
		editor_remove: "Удалить",
		editor_rename_newTitle: "Новое название",
		editor_rename_cancel: "Отмена",
		editor_rename_confirm: "Переименовать",
		editor_launch_confirm: "Перезапустить приложение для смены аккаунта?",
		wallet_remote_title: "Удалённый кошелёк",
		wallet_remote_info: "Подключиться к серверу leadertvcoind",
		wallet_fictive_title: "Фиктивный кошелёк",
		wallet_fictive_info: "Фальшивый кошелёк для отладки.",
		crash_title: "Критическая ошибка",
		btn_recovery: "Восстановление",
		btn_ok: "Игнорировать"
	},
	walletHome: {
		title_connecting: "Подключение...",
		title_syncing: "Синхринизация...",
		action_explore: "Обзор",
		action_settings: "Параметры",
		action_receive: "Получить",
		action_send: "Отправить",
		action_history: "Журнал",
		balance_unconfirmed: "Не подтверждено",
		balance_pending: "Дозревают",
		update_title: "Доступна новая версия приложения",
		update_message: "Нажмите для обновления",
		group_history: "Недавние операции",
		history_loading: "Загрука...",
		history_empty: "Ваши транзакции появятся тут :-)",
		bgMode_title: "О фоновом режиме",
		bgMode_message: "Один из компонентов приложения (leadertvcoind) остаётся активным "+
					"даже после закрытия окна приложения. Сделано это для более быстрого запуска, плюс "+
					"это позволяет майнить в фоновом режиме и обновлять данные. Но "+
					"пока он запущен, вы не сможете запустить оригинальное приложение leadertvcoin. "+
					"Для полного закрытия приложения используйте пункт \"Выйти\" в настройках. "+
					"Вы можете отключить фоновый режим в настройках приложения.<br/><br/>"+
					"Это сообщение больше не появится."
	},
	explorer: {
		title: "Обзор",
		header_state: "Состояние",
		header_price: "Цены",
		action_clear_banned: "Очистить заблокированные",
		status_blocks: "Блоки",
		status_masternodes: "Мастернод",
		status_connections: "Кол-во подключений",
		status_banned: "Заблокировано",
		status_network_speed: "Скорость",
		status_difficulty: "Сложность",
		price_today: "За 1 монету",
		price_all: "За все ваши",
		prices_24h: "Динамика за сутки",
		prices: "Продажа / Покупка"
	},
	transactionView: {
		action_repeat: "Повторить",
		group_info: "Сведения",
		prop_address: "Адрес",
		prop_id: "ID транзакции",
		prop_date: "Дата операции",
		prop_confirmations: "Количество подтверждений",
		prop_comment: "Коментарий"
	},
	receiveScreen: {
		action_copy: "Скопировать",
		action_send: "Отправить",
		prop_address: "Адрес получателя",
		prop_comment: "Коментарий для получателя",
		prop_comment_holder: "Не обязательно",
		error_noSum: "Введите сумму",
		error_invalidAddress: "Указанный вами адрес, не существует",
		error_noMoney: "Не хватает средств для перевода"
	},
	historyScreen: {
		title: "История операций",
		action_more: "Показать ещё"
	},
	toolsScreen: {
		action_reload: "Перезапустить",
		action_exit: "Выйти из приложения",
		account: "Мой аккаунт",
		account_info: "Логин, пароль, т. п.",
		system: "Системные настройки",
		system_info: "Автозапуск и прочее",
		ui: "Внешний вид (бета)",
		ui_info: "Тема, цвет, размер интерфейса",
		mining: "Настроить майнинг",
		mining_info: "Настройки генерации криптовалюты",
		recover: "Копирование и восстановление",
		recover_info: "Бэкап, решение проблем",
		donate: "Помочь проекту",
		donate_info: "Поддержать разработку mWallet-LTV",
		advanced: "Расширенные настройки",
		advanced_info: "Отладка, консоль, прочее"
	},
	advancedSettings: {
		myaccounts: "Управление аккаунтами",
		console: "Консоль отладки"
	},
	lockScreen: {
		prompt_password: "Пароль",
		alert_unlockRequired: "Для этой операции нужно раблокировать кошелёк. Введите ваш пароль:",
		cancel: "Отмена",
		confirm_unlock: "Разблокировать",
		error_invalidPassword: "Неверный пароль"
	},
	minerSettings: {
		title: "Майнинг (соло)",
		toggle_main: "Запустить майнинг",
		toggle_main_info: "Когда этот параметр включён, компьютер используется для майнинга (генерации) новых монет. Это может повлиять на производительность системы.",
		pow_threads_title: "Настроить количество потоков",
		pow_hashrate_prefix: "Скорость майнинга (хзшрейт)",
		pow_bgmode_notice: "Вы можете закрыть окно приложения, майнинг продолжится в фоновом режиме.",
		action_apply: "Применить",
		count_unlimited: "Неограничено",
		cancel: "Отмена"
	},
	recoverySettings: {
		createBackup: "Создать резервную копию",
		restoreBackup: "Восстановить резервную копию",
		recovery: "Ремонт кошелька"
	},
	donateScreen: {
		donate_ltv: "Задонатить немного LTV монет",
		donate_rub: "Поддержать рублём",
		be_translator: "Стать переводчиком",
		donate_translator: "Поддержать автора русского перевода"
	}
};
