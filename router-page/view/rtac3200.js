"use strict";
"require view";

return view.extend({
	render: function() {
		window.location.replace("/rtac3200.html");
		return E("div", { "class": "spinning" });
	}
});
