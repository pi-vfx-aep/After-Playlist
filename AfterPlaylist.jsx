//AfterPlaylist 4.0.0

(function (thisObj) {
    function tempFile(name) { return new File(Folder.temp.fsName + "/" + name); }
    function psQuote(val) { return "'" + String(val).replace(/'/g, "''") + "'"; }
    function cmdQuote(val) { return "\"" + String(val).replace(/\"/g, "\\\"") + "\""; }
    function vbsQuote(val) { return "\"" + String(val).replace(/\"/g, "\"\"") + "\""; }

    function writeFile(file, text) {
        file.encoding = "UTF-8";
        if (!file.open("w")) return;
        file.write(text);
        file.close();
    }

    function readFile(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) return "";
        var text = file.read();
        file.close();
        return String(text).replace(/^\uFEFF/, "").replace(/^\s+|\s+$/g, "");
    }

    function runMediaCommand(vkCode, count) {
        var id = String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 100000));
        var sF = tempFile("ap_media_" + id + ".ps1");
        var lF = tempFile("ap_media_" + id + ".vbs");
        var s = ["$ErrorActionPreference = 'Stop'", "try {", " Add-Type @'", "using System; using System.Runtime.InteropServices;", "public static class ApKeys {", " [DllImport(\"user32.dll\")] public static extern void keybd_event(byte b, byte s, uint f, UIntPtr e);", "}", "'@", " $k = [byte]" + vkCode + "; $c = [int]" + (count || 1), " for ($i=0; $i -lt $c; $i++) {", " [ApKeys]::keybd_event($k, 0, 0, [UIntPtr]::Zero); Start-Sleep -m 15", " [ApKeys]::keybd_event($k, 0, 2, [UIntPtr]::Zero); Start-Sleep -m 15", " }", "} catch { }", "Start-Sleep -m 100", "Remove-Item -LiteralPath " + psQuote(sF.fsName) + " -Force -EA SilentlyContinue", "Remove-Item -LiteralPath " + psQuote(lF.fsName) + " -Force -EA SilentlyContinue"].join("\r\n");
        var l = ["Dim sh: Set sh = CreateObject(\"WScript.Shell\")", "cmd = \"powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \" & Chr(34) & " + vbsQuote(sF.fsName) + " & Chr(34)", "sh.Run cmd, 0, False"].join("\r\n");
        writeFile(sF, s); writeFile(lF, l);
        system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(lF.fsName));
    }

    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "AfterPlaylist", undefined, { resizable: true });
        var bg = [0.12, 0.12, 0.12], card = [0.16, 0.16, 0.16], cardAlt = [0.20, 0.20, 0.20];
        var accent = [0.38, 0.66, 0.46], white = [0.88, 0.88, 0.88], muted = [0.62, 0.62, 0.62];

        function brush(c, clr) { try { c.graphics.backgroundColor = c.graphics.newBrush(c.graphics.BrushType.SOLID_COLOR, clr); } catch(e) {} }
        function pen(c, clr) { try { c.graphics.foregroundColor = c.graphics.newPen(c.graphics.PenType.SOLID_COLOR, clr, 1); } catch(e) {} }
        function paint(c, b, f) { brush(c, b); pen(c, f); }
        function label(p, t, s, clr) {
            var i = p.add("statictext", undefined, t);
            i.graphics.font = ScriptUI.newFont("Segoe UI", "REGULAR", s);
            pen(i, clr); return i;
        }
        function buttonStyle(b, bg, fg, h) {
            b.preferredSize.height = h || 34;
            b.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 10);
            paint(b, bg, fg);
        }
        function divider(p) {
            var l = p.add("panel"); l.preferredSize.height = 1;
            brush(l, [0.16, 0.19, 0.21]); return l;
        }

        panel.orientation = "column"; panel.alignChildren = ["fill", "top"];
        panel.spacing = 10; panel.margins = 14; paint(panel, bg, white);

        // Header
        var header = panel.add("group");
        header.orientation = "row"; header.alignChildren = ["left", "center"]; header.spacing = 10;
        var mark = header.add("panel"); mark.preferredSize = [8, 34]; brush(mark, accent);
        var titleCol = header.add("group");
        titleCol.orientation = "column"; titleCol.alignChildren = ["left", "top"]; titleCol.alignment = ["fill", "center"]; titleCol.spacing = 1;
        var title = label(titleCol, "AfterPlaylist", 15, white); title.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 15);
        var songInfo = label(titleCol, "Fetching track...", 9, muted); songInfo.alignment = ["fill", "top"];

        var btnSpotify = header.add("button", undefined, "S");
        btnSpotify.preferredSize = [24, 24]; btnSpotify.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 10);
        paint(btnSpotify, cardAlt, accent); btnSpotify.helpTip = "Open Spotify";

        var btnCompact = header.add("button", undefined, "C");
        btnCompact.preferredSize = [24, 24]; btnCompact.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 10);
        paint(btnCompact, cardAlt, muted); btnCompact.helpTip = "Toggle Compact Mode";

        var badge = header.add("statictext", undefined, "  READY  ");
        badge.alignment = "right"; badge.minimumSize = [60, 18];
        badge.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 8);
        paint(badge, cardAlt, muted);

        var dividerLine = divider(panel);

        // Playback
        var playbackPanel = panel.add("panel");
        playbackPanel.orientation = "column"; playbackPanel.alignChildren = ["fill", "top"]; playbackPanel.margins = 12; playbackPanel.spacing = 8;
        paint(playbackPanel, card, white);
        var playbackRow = playbackPanel.add("group");
        playbackRow.orientation = "row"; playbackRow.alignChildren = ["fill", "center"]; playbackRow.spacing = 7;
        var btnPrev = playbackRow.add("button", undefined, "Previous");
        var btnPP = playbackRow.add("button", undefined, "Play / Pause");
        var btnNext = playbackRow.add("button", undefined, "Next");
        buttonStyle(btnPrev, cardAlt, white, 40); buttonStyle(btnPP, cardAlt, white, 44); buttonStyle(btnNext, cardAlt, white, 40);

        // Volume Card
        var volumePanel = panel.add("panel");
        volumePanel.orientation = "column"; volumePanel.alignChildren = ["fill", "top"]; volumePanel.margins = 12; volumePanel.spacing = 8;
        paint(volumePanel, card, white);
        var volumeRow = volumePanel.add("group");
        volumeRow.orientation = "row"; volumeRow.alignChildren = ["fill", "center"]; volumeRow.spacing = 7;
        var btnVolD = volumeRow.add("button", undefined, "Volume -");
        var btnMute = volumeRow.add("button", undefined, "Mute");
        var btnVolU = volumeRow.add("button", undefined, "Volume +");
        buttonStyle(btnVolD, cardAlt, white, 34); buttonStyle(btnMute, cardAlt, white, 34); buttonStyle(btnVolU, cardAlt, white, 34);

        // Status
        var statusRow = panel.add("group");
        statusRow.orientation = "row"; statusRow.alignChildren = ["left", "center"]; statusRow.spacing = 6;
        var statusDot = label(statusRow, "●", 10, accent);
        var statusText = label(statusRow, "Ready", 9, muted);
        statusText.alignment = ["fill", "center"];
        var btnDiag = panel.add("button", undefined, "Test Setup");
        btnDiag.preferredSize = [92, 24]; btnDiag.graphics.font = ScriptUI.newFont("Segoe UI", "REGULAR", 9);
        paint(btnDiag, cardAlt, muted);

        //logic
        var closed = false, lastCommandAt = 0, CLICK_COOLDOWN = 700, isCompact = false;
        var npFile = tempFile("afterplaylist_np.txt"), isFetchingNP = false, fullSongText = "", scrollIndex = 0, LIMIT = 30;

        function setStatus(text) { if (!closed) statusText.text = text; }

        function send(vk, count, desc) {
            var now = new Date().getTime();
            if (closed || (now - lastCommandAt) < CLICK_COOLDOWN) return;
            lastCommandAt = now;
            try { setStatus("Sending " + desc + "..."); runMediaCommand(vk, count); setStatus("Sent: " + desc); } catch (e) { setStatus("Error: " + e.message); }
        }

        function toggleCompact() {
            isCompact = !isCompact;
            mark.visible = !isCompact; title.visible = !isCompact; songInfo.visible = !isCompact;
            volumePanel.visible = !isCompact; dividerLine.visible = !isCompact;
            paint(btnCompact, cardAlt, isCompact ? accent : muted);
            panel.layout.layout(true);
        }

        function openSpotify() {
            if (closed) return;
            try {
                setStatus("Launching Spotify...");
                var id = "launch_" + String(new Date().getTime());
                var sF = tempFile("ap_launch_" + id + ".ps1"), lF = tempFile("ap_launch_" + id + ".vbs");
                var s = "Start-Process 'spotify:'";
                var l = ["Dim sh: Set sh = CreateObject(\"WScript.Shell\")", "cmd = \"powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \" & Chr(34) & " + vbsQuote(sF.fsName) + " & Chr(34)", "sh.Run cmd, 0, False"].join("\r\n");
                writeFile(sF, s); writeFile(lF, l);
                system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(lF.fsName));
                setStatus("Spotify launched");
            } catch (e) { setStatus("Error: " + e.message); }
        }

        function runDiagnostics() {
            var ps = new File("C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe");
            var ws = new File("C:/Windows/System32/wscript.exe");
            try {
                if (!ps.exists || !ws.exists) { setStatus("Setup error: System files missing"); return; }
                setStatus("Setup OK: System ready");
            } catch (e) { setStatus("Error: " + e.message); }
        }

        function fetchNowPlaying() {
            if (closed || isFetchingNP || isCompact) return;
            isFetchingNP = true;
            var id = "np_" + String(new Date().getTime());
            var sF = tempFile("ap_np_" + id + ".ps1"), lF = tempFile("ap_np_" + id + ".vbs");
            var s = ["$ErrorActionPreference = 'Stop'", "try {", " Add-Type -AssemblyName System.Runtime.WindowsRuntime", " $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]", " function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; return $t.Result }", " $mType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]", " $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) $mType", " $s = $mgr.GetCurrentSession()", " if ($s) { $pType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]; $p = Await ($s.TryGetMediaPropertiesAsync()) $pType; $res = $p.Artist + ' - ' + $p.Title } else { $res = 'Nothing playing' }", " Set-Content -Path " + psQuote(npFile.fsName) + " -Value $res -Encoding UTF8", "} catch { Set-Content -Path " + psQuote(npFile.fsName) + " -Value 'Nothing playing' -Encoding UTF8 }", "Remove-Item -LiteralPath " + psQuote(sF.fsName) + " -Force; Remove-Item -LiteralPath " + psQuote(lF.fsName) + " -Force"].join("\r\n");
            var l = ["Dim sh: Set sh = CreateObject(\"WScript.Shell\")", "cmd = \"powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \" & Chr(34) & " + vbsQuote(sF.fsName) + " & Chr(34)", "sh.Run cmd, 0, False"].join("\r\n");
            writeFile(sF, s); writeFile(lF, l); system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(lF.fsName));
        }

        function checkNowPlaying() {
            if (closed || !npFile.exists) return;
            try {
                var c = readFile(npFile);
                if (c && c !== fullSongText) { fullSongText = c; scrollIndex = 0; }
                npFile.remove();
                panel.layout.layout(true);
            } catch(e) {}
            isFetchingNP = false;
        }

        function scrollText() {
            if (closed || isCompact || !fullSongText || fullSongText.length <= LIMIT) { if(fullSongText && !isCompact) songInfo.text = fullSongText; return; }
            var m = fullSongText + "   |   " + fullSongText;
            songInfo.text = m.substring(scrollIndex, scrollIndex + LIMIT);
            scrollIndex++; if (scrollIndex > fullSongText.length + 6) scrollIndex = 0;
        }

        //button handlers
        btnPP.onClick = function() { send(0xB3, 1, "Play/Pause"); };
        btnPrev.onClick = function() { send(0xB1, 1, "Prev"); };
        btnNext.onClick = function() { send(0xB0, 1, "Next"); };
        btnMute.onClick = function() { send(0xAD, 1, "Mute"); };
        btnVolD.onClick = function() { send(0xAE, 2, "Vol Down"); };
        btnVolU.onClick = function() { send(0xAF, 2, "Vol Up"); };
        btnDiag.onClick = runDiagnostics;
        btnSpotify.onClick = openSpotify;
        btnCompact.onClick = toggleCompact;

        //bg timers
        $.global.__apPoll = checkNowPlaying; $.global.__apFetch = fetchNowPlaying; $.global.__apScroll = scrollText;
        var pT = app.scheduleTask("$.global.__apPoll()", 1000, true);
        var fT = app.scheduleTask("$.global.__apFetch()", 6000, true);
        var sT = app.scheduleTask("$.global.__apScroll()", 300, true);

        panel.onClose = function() {
            app.cancelTask(pT); app.cancelTask(fT); app.cancelTask(sT);
            closed = true;
        };

        panel.layout.layout(true);
        return panel;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) { ui.center(); ui.show(); }
})(this);
