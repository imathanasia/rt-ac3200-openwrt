'use strict';
'require view';
'require rpc';
'require uci';
'require fs';

var callInfo = rpc.declare({ object: 'system', method: 'info' });
var callBoard = rpc.declare({ object: 'system', method: 'board' });
var callServices = rpc.declare({ object: 'service', method: 'list', params: { verbose: true } });
var wifiStatus = function() {
	return fetch('/cgi-bin/rtac3200?stat', { cache: 'no-store', credentials: 'same-origin' })
		.then(function(r) { return r.ok ? r.json() : {}; })
		.catch(function() { return {}; });
};

var CSS = ''
	+ '.rt{max-width:1080px;margin:0 auto;font:14px/1.55 system-ui,sans-serif;color:var(--text-color,#e6edf3)}'
	+ '.rt h1{font-size:22px;margin:0 0 4px}.rt .sub{color:#8b98a9;font-size:13px;margin-bottom:16px}'
	+ '.rt .chips span{display:inline-block;margin:0 8px 6px 0;padding:2px 9px;border:1px solid #2d3a55;border-radius:99px;font-size:12px;color:#9fc4ff}'
	+ '.rt .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:14px 0}'
	+ '.rt .c{background:#171b24;border:1px solid #242a38;border-radius:12px;padding:12px 14px}'
	+ '.rt .c h3{margin:0 0 6px;font-size:14px;color:#dfe6ef}.rt .c p{margin:0;color:#9aa4b2;font-size:13px}'
	+ '.rt .ok{color:#3fb950}.rt .off{color:#d29922}.rt code{background:#0f131a;border:1px solid #242a38;border-radius:5px;padding:1px 5px;font-size:12px}'
	+ '.rt a{color:#58a6ff;text-decoration:none}.rt a:hover{text-decoration:underline}'
	+ '.rt .qr{background:#fff;padding:8px;border-radius:8px;display:inline-block}.rt .qr svg{display:block;width:150px;height:150px}'
	+ '.rt .f{margin-top:18px;padding-top:10px;border-top:1px solid #242a38;color:#8b98a9;font-size:12px}';

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function(c) {
	return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function svc(list, name) { return (list && list[name]) || null; }
function svcRunning(v) { var inst = (v && v.instances) || {}; return Object.keys(inst).some(function(k) { return inst[k] && inst[k].running; }); }
function dur(sec) { var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60); return (d ? d + 'd ' : '') + h + 'h ' + m + 'm'; }

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(callInfo(), {}),
			L.resolveDefault(callBoard(), {}),
			L.resolveDefault(callServices(), {}),
			L.resolveDefault(wifiStatus(), {}),
			uci.load('wireless').catch(function() {})
		]);
	},

	render: function(data) {
		var info = data[0] || {}, board = data[1] || {}, services = data[2] || {};
		var stat = data[3] || {};
		var radios = [], i;

		for (i = 0; ; i++) {
			var r = uci.get('wireless', 'radio' + i, 'disabled');
			if (r == null) break;
			var ssid = uci.get('wireless', 'default_radio' + i, 'ssid') || '';
			var key = uci.get('wireless', 'default_radio' + i, 'key') || '';
			radios.push({ name: 'radio' + i, off: (r == '1'), ssid: ssid, key: key, band: (uci.get('wireless', 'radio' + i, 'band') || '') });
		}

		var radioOn = (Array.isArray(stat.radios) && stat.radios.length) || radios.some(function(x) { return !x.off; });
		var mem = info.memory || {};
		var l1 = Number(info.load && info.load[0] || 0) / 65536;
		var l2 = Number(info.load && info.load[1] || 0) / 65536;
		var l3 = Number(info.load && info.load[2] || 0) / 65536;
		var ramUsed = Math.round((Number(mem.total || 0) - Number(mem.free || 0)) / 1048576);
		var ramTotal = Math.round(Number(mem.total || 0) / 1048576);
		var html = [];

		html.push('<h1>ASUS RT-AC3200 · OpenWrt homelab</h1>');
		html.push('<div class="sub">' + esc(board.model || 'ASUS RT-AC3200') + ' — ' + esc((board.release && board.release.description) || 'OpenWrt') + '</div>');
		html.push('<div class="chips"><span>uptime ' + dur(info.uptime || 0) + '</span>' +
			'<span>load ' + l1.toFixed(2) + ' / ' + l2.toFixed(2) + ' / ' + l3.toFixed(2) + '</span>' +
			'<span>RAM ' + ramUsed + ' / ' + ramTotal + ' MB</span>' +
			'<span>radios ' + (radioOn ? 'ON' : 'OFF') + '</span></div>');

		html.push('<div class="grid">');
		html.push('<div class="c"><h3>Radios</h3>');
		if (!radios.length) html.push('<p>No wireless configuration yet; <code>wifi config</code> writes one.</p>');
		(Array.isArray(stat.radios) ? stat.radios : []).forEach(function(x) {
			html.push('<p>' + esc(x.if || '') + ' (ch ' + esc(x.ch || '?') + '): <b class="' + (Number(x.sta) >= 0 ? 'ok' : 'off') + '">' + esc(x.ssid || '') + '</b> — ' + esc(x.sta || '0') + ' clients</p>');
		});
		if (!Array.isArray(stat.radios) || !stat.radios.length) radios.forEach(function(x) {
			html.push('<p>' + esc(x.name) + ' (' + esc(x.band || '?') + '): <b class="' + (x.off ? 'off' : 'ok') + '">' + (x.off ? 'off' : 'configured') + '</b>' + (x.ssid ? ' — ' + esc(x.ssid) : '') + '</p>');
		});
		html.push('<p style="margin-top:6px">Wi-Fi off by default; <code>wifi-radio on</code> / <code>off</code> / <code>status</code></p>');
		html.push('<div id="rt-qr" style="margin-top:10px"></div>');
		html.push('</div>');

		html.push('<div class="c"><h3>Hardware</h3>' +
			'<p>BCM4709A0, dual 1 GHz Cortex-A9, 256 MB RAM, 3× BCM4360 radios (2.4G + 5G + 5G-2).</p>' +
			'<p>AP mode on <code>192.168.1.200</code>, AdGuard Home, Tailscale, WireGuard preconfigured.</p>' +
			'<p>No HW NAT offload on this platform.</p></div>');

		html.push('<div class="c"><h3>Recovery &amp; updates</h3>' +
			'<p><b>Recovery mode</b>: power off, hold <b>Reset</b>, power on, release when Power LED blinks slowly; PC at <code>192.168.1.10</code>.</p>' +
			'<p>Upload with ASUS Firmware Restoration or <code>curl -T firmware.trx tftp://192.168.1.1/</code>.</p>' +
			'<p>Never 30-30-30 on this board.</p></div>');

		html.push('<div class="c"><h3>Quick start</h3>' +
			'<p><b>1. Secure it</b> — <code>passwd</code> (ships <code>ac3200-admin</code>).<br>' +
			'<b>2. Radios</b> — off by default; <code>wifi-radio on</code> when you want Wi-Fi.<br>' +
			'<b>3. DNS</b> — AdGuard Home on <code>:3000</code>, dnsmasq hands off to it.<br>' +
			'<b>4. Disks</b> — plug a USB disk for ksmbd/aria2; <code>/root/usb-overlay.sh</code> sets up extroot.</p>' +
			'</div>');
		html.push('</div>');

		var names = [['adguardhome','AdGuard Home'],['tailscale','Tailscale'],['sqm','SQM'],
			['ksmbd','ksmbd (SMB3)'],['aria2','aria2'],['nlbwmon','nlbwmon'],['vnstat','vnstat2'],
			['banip','banip'],['mwan3','mwan3'],['ttyd','ttyd'],['usteer','usteer'],
			['udpxy','udpxy'],['wifi_schedule','Wi-Fi schedule'],['watchcat','watchcat']];
		html.push('<h3 style="font-size:15px;margin:18px 0 4px">Services</h3>' +
			'<div class="sub" style="margin:0 0 8px">opt-in services stay off until installed; state is live from procd</div><div class="grid">');
		names.forEach(function(n) {
			var s = svc(services, n[0]);
			var running = svcRunning(s);
			var state = !s ? 'off (no instance)' : (running ? 'running' : (s.enabled ? 'enabled, stopped' : 'off'));
			var cls = !s ? 'off' : (running ? 'ok' : 'off');
			html.push('<div class="c"><h3>' + esc(n[1]) + '</h3><p class="' + cls + '">' + esc(state) + '</p></div>');
		});
		html.push('</div>');

		html.push('<p class="f">Project and packaging by <b>ImAthanasia</b> · repo <a href="https://github.com/ImAthanasia/rt-ac3200-openwrt" target="_blank" rel="noopener">rt-ac3200-openwrt</a> ' +
			'· radios are off unless you start them · built-in page served by LuCI (login required) · root <code>ac3200-admin</code>, AdGuard <code>admin/ac3200-admin</code></p>');

		var node = E('div', { 'class': 'rt' }, [
			E('style', {}, CSS),
			E('div', { 'id': 'rt-body' })
		]);
		node.querySelector('#rt-body').innerHTML = html.join('');

		var on = radios.filter(function(x) { return x.ssid; })[0];
		if (on) {
			var payload = 'WIFI:T:WPA;S:' + on.ssid + ';P:' + (on.key || '') + ';;';
			fs.exec('/usr/bin/qrencode', [ '-t', 'SVG', '-o', '-', '-l', 'M', payload ])
				.then(function(res) {
					var box = node.querySelector('#rt-qr');
					if (box && res && res.stdout) box.innerHTML = '<span class="qr">' + res.stdout + '</span>' + '<div class="sub" style="margin:6px 0 0">scan to join ' + esc(on.ssid) + '</div>';
				})
				.catch(function() { /* qrencode or ACL unavailable: stay quiet */ });
		}

		return node;
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});

