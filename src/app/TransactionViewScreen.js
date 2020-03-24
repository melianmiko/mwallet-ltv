class TransactionViewScreen extends Screen {
	constructor(data) {
		super();
		this.data = data;
	}

	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new LeftSideScreenMod());

		if(this.data.category == "send") this.appendView(new RowView()
			.setTitle(appLocale.transactionView.action_repeat)
			.setIcon("refresh")
			.setOnClickListener(() => {
				new SendScreen(this.data.address, this.data.amount, this.data.comment).start();
			}));

		this.appendView(new SubHeader(appLocale.transactionView.group_info));

		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_address)
			.setSummary("<a style='word-break:break-all'>"+this.data.address+"</a>	"));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_id)
			.setSummary("<a style='word-break:break-all'>"+this.data.txid+"</a>"));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_date)
			.setSummary(new Date(this.data.time).toString()));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_confirmations)
			.setSummary(this.data.confirmations));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_comment)
			.setSummary(this.data.comment));
	}
}
