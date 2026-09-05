//AfterPlaylist 4.1.0


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
        
        //colors and helpers
        var bg = [0.03, 0.03, 0.03];
        var card = [0.06, 0.06, 0.06];
        var cardAlt = [0.10, 0.10, 0.10];
        var accent = [0.11, 0.72, 0.33];
        var white = [0.95, 0.95, 0.95];
        var muted = [0.40, 0.40, 0.40];

        function brush(c, clr) { try { c.graphics.backgroundColor = c.graphics.newBrush(c.graphics.BrushType.SOLID_COLOR, clr); } catch(e) {} }
        function pen(c, clr) { try { c.graphics.foregroundColor = c.graphics.newPen(c.graphics.PenType.SOLID_COLOR, clr, 1); } catch(e) {} }
        function paint(c, b, f) { brush(c, b); pen(c, f); }
        
        function label(p, t, s, clr, bld) {
            var i = p.add("statictext", undefined, t);
            i.graphics.font = ScriptUI.newFont("Segoe UI", bld ? "BOLD" : "REGULAR", s);
            pen(i, clr); return i;
        }

        function styleBtn(b, type, h) {
            b.preferredSize.height = h || 32;
            b.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 10);
            if (type === "primary") paint(b, accent, bg);
            else if (type === "secondary") paint(b, cardAlt, white);
            else paint(b, card, muted);
        }

        //header
        panel.orientation = "column"; panel.alignChildren = ["fill", "top"];
        panel.spacing = 12; panel.margins = 16; paint(panel, bg, white);

        var utilBar = panel.add("group");
        utilBar.orientation = "row"; utilBar.alignChildren = ["left", "center"];
        label(utilBar, "AFTERPLAYLIST", 9, muted, true);
        
        var spacer = utilBar.add("group"); spacer.alignment = ["fill", "center"];
        
        var btnSpotify = utilBar.add("button", undefined, "◈");
        btnSpotify.preferredSize = [22, 22]; styleBtn(btnSpotify, "utility");
        btnSpotify.helpTip = "Open Spotify";
        
        var btnCompact = utilBar.add("button", undefined, "▢");
        btnCompact.preferredSize = [22, 22]; styleBtn(btnCompact, "utility");
        btnCompact.helpTip = "Toggle Compact Mode";

        var heroCard = panel.add("panel");
        heroCard.orientation = "column"; heroCard.alignChildren = ["center", "center"];
        heroCard.margins = [20, 24, 20, 24];
        paint(heroCard, card, white);
        
        label(heroCard, "Now Playing", 9, accent, true);
        var songInfo = label(heroCard, "Fetching...", 16, white, true);
        songInfo.alignment = ["fill", "center"];
        songInfo.justify = "center";

        //playback and volume
        var controlsGroup = panel.add("group");
        controlsGroup.orientation = "column"; controlsGroup.alignChildren = ["fill", "top"];
        controlsGroup.spacing = 16;

        var playbackRow = controlsGroup.add("group");
        playbackRow.orientation = "row"; playbackRow.alignChildren = ["fill", "center"];
        playbackRow.spacing = 8;

        var btnPrev = playbackRow.add("button", undefined, "◀◀");
        var btnPP = playbackRow.add("button", undefined, "▶ Ⅱ");
        var btnNext = playbackRow.add("button", undefined, "▶▶");

        styleBtn(btnPrev, "secondary", 38);
        styleBtn(btnPP, "primary", 46);
        styleBtn(btnNext, "secondary", 38);

        var volumeRow = controlsGroup.add("group");
        volumeRow.orientation = "row"; volumeRow.alignChildren = ["fill", "center"];
        volumeRow.spacing = 6;

        var btnVolD = volumeRow.add("button", undefined, "-");
        var btnMute = volumeRow.add("button", undefined, "✕");
        var btnVolU = volumeRow.add("button", undefined, "+");

        styleBtn(btnVolD, "utility", 28);
        styleBtn(btnMute, "secondary", 28);
        styleBtn(btnVolU, "utility", 28);

        //the footer and status
        var footer = panel.add("group");
        footer.orientation = "row"; footer.alignChildren = ["left", "center"];
        footer.spacing = 8;

        var statusDot = label(footer, "●", 8, accent);
        var statusText = label(footer, "Ready", 8, muted);
        statusText.alignment = ["fill", "center"];
        
        var btnDiag = footer.add("button", undefined, "Diagnostics");
        btnDiag.preferredSize = [80, 20]; styleBtn(btnDiag, "utility");

        // Logic
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
            heroCard.visible = !isCompact;
            volumeRow.visible = !isCompact;
            footer.visible = !isCompact;
            btnPP.preferredSize.height = isCompact ? 34 : 46;
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

        btnPP.onClick = function() { send(0xB3, 1, "Play/Pause"); };
        btnPrev.onClick = function() { send(0xB1, 1, "Prev"); };
        btnNext.onClick = function() { send(0xB0, 1, "Next"); };
        btnMute.onClick = function() { send(0xAD, 1, "Mute"); };
        btnVolD.onClick = function() { send(0xAE, 2, "Vol Down"); };
        btnVolU.onClick = function() { send(0xAF, 2, "Vol Up"); };
        btnDiag.onClick = runDiagnostics;
        btnSpotify.onClick = openSpotify;
        btnCompact.onClick = toggleCompact;

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
