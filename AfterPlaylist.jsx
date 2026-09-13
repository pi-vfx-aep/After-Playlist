//AfterPlaylist 5.0.0 FINAL VER
// ui updates :D

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
        
        // pallette
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
            b.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", type === "primary" ? 14 : 10);
            if (type === "primary") paint(b, accent, bg);
            else if (type === "secondary") paint(b, cardAlt, white);
            else paint(b, bg, muted);
        }

        function savePreference(key, value) {
            try { app.settings.saveSetting("AfterPlaylist", key, String(value)); } catch (e) {}
        }

        function loadPreference(key, fallback) {
            try {
                if (app.settings.haveSetting("AfterPlaylist", key)) {
                    return app.settings.getSetting("AfterPlaylist", key);
                }
            } catch (e) {}
            return fallback;
        }

        var pollSeconds = parseInt(loadPreference("pollSeconds", "6"), 10);
        if (pollSeconds !== 3 && pollSeconds !== 6 && pollSeconds !== 10 && pollSeconds !== 15) pollSeconds = 6;
        var startCompact = loadPreference("startCompact", "false") === "true";
        var scrollEnabled = loadPreference("scrollEnabled", "true") !== "false";
        var showFooter = loadPreference("showFooter", "true") !== "false";

        // header and hero
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

        var btnSettings = utilBar.add("button", undefined, "⚙");
        btnSettings.preferredSize = [22, 22]; styleBtn(btnSettings, "utility");
        btnSettings.helpTip = "Open Settings";

        // Playback buttons are created before the hero card so they remain at the top in Compact Mode.
        var controlsGroup = panel.add("group");
        controlsGroup.orientation = "column"; controlsGroup.alignChildren = ["fill", "top"];
        controlsGroup.spacing = 16;

        var playbackRow = controlsGroup.add("group");
        playbackRow.orientation = "row"; playbackRow.alignChildren = ["fill", "center"];
        playbackRow.spacing = 8;

        var btnPrev = playbackRow.add("button", undefined, "◀◀");
        var btnPP = playbackRow.add("button", undefined, "▶  Ⅱ");
        var btnNext = playbackRow.add("button", undefined, "▶▶");

        styleBtn(btnPrev, "secondary", 38);
        styleBtn(btnPP, "primary", 46);
        styleBtn(btnNext, "secondary", 38);

        var heroCard = panel.add("panel");
        heroCard.orientation = "column"; heroCard.alignChildren = ["center", "center"];
        heroCard.margins = [20, 30, 20, 30];
        paint(heroCard, card, white);

        var stateLabel = label(heroCard, "READY", 8, accent, true);
        var songInfo = label(heroCard, "Waiting for a track...", 18, white, true);
        songInfo.alignment = ["fill", "center"];
        songInfo.justify = "center";

        var volumeRow = controlsGroup.add("group");
        volumeRow.orientation = "row"; volumeRow.alignChildren = ["fill", "center"];
        volumeRow.spacing = 6;

        var btnVolD = volumeRow.add("button", undefined, "−");
        var btnMute = volumeRow.add("button", undefined, "✕");
        var btnVolU = volumeRow.add("button", undefined, "+");

        styleBtn(btnVolD, "utility", 28);
        styleBtn(btnMute, "secondary", 28);
        styleBtn(btnVolU, "utility", 28);

        // Footer and status
        var footer = panel.add("group");
        footer.orientation = "column"; footer.alignChildren = ["fill", "top"];
        footer.spacing = 4;

        var statusRow = footer.add("group");
        statusRow.orientation = "row"; statusRow.alignChildren = ["fill", "center"];
        statusRow.spacing = 5;
        var statusDot = label(status, "●", 8, accent);
        statusDot.preferredSize = [10, 20];
        statusDot.alignment = ["fill", "center"];
        var statusText = label(statusRow, "Ready", 8, muted);
        statusText.alignment = ["fill", "center"];
        statusText.preferredSize = [180, 20];
        try { statusText.truncate = "end"; } catch (e) {}
        statusText.helpTip = "AfterPlaylist status";

        var diagRow = footer.add("group");
        diagRow.orientation = "row"; diagRow.alignment = ["right", "center"];
        var btnDiag = diagRow.add("button" undefined, "Check");
        btnDiag.preferredSize = [62, 20]; styleBtn(btnDiag, "utility");
        btnDiag.helpTip = "Run diagnostics";

        // Logic
        var closed = false, lastCommandAt = 0, CLICK_COOLDOWN = 700, isCompact = false;
        var npFile = tempFile("afterplaylist_np.txt"), isFetchingNP = false, fullSongText = "", scrollIndex = 0, LIMIT = 30;
        var fetchStartedAt = 0, FETCH_TIMEOUT = 12000;

        function setStatus(text) {
            if (!closed) {
                statusText.text = text;
                statusText.helpTip = text;
            }
        }

        function setError(code, message) {
            setStatus(code + " " + message);
        }

        function setPlaybackState(state, color, detail) {
            if (closed) return;
            stateLabel.text = state;
            pen(stateLabel, color || accent);
            if (detail) setStatus(detail);
            panel.layout.layout(true);
        }

        function send(vk, count, desc) {
           var now = new Date().getTime();
           if (closed || (now = lastCommandAt) < CLICK_COOLDOWN) return;
           lastCommandAt = now;
           try {
            setStatus("Sending " + desc + "...");
            runMediaCommand(vk, count);
            setStatus("Sent: " desc);
           } catch (e) {
            setError("E201", "Media command failed: " + e.message);
           }
        }

        function toggleCompact() {
            isCompact = !isCompact;
            heroCard.visible = !isCompact;
            volumeRow.visible = !isCompact;
            footer.visible = showFooter && !isCompact;
            controlsGroup.spacing = isCompact ? 0 : 16;
            btnPP.preferredSize.height = isCompact ? 34 : 46;
            btnCompact.text = isCompact ? "▣" : "▢";
            btnCompact.helpTip = isCompact ? "Exit Compact Mode" : "Toggle Compact Mode";
            savePreference("startCompact", isCompact);
            panel.layout.layout(true);
            panel.layout.resize();
        }

        function openSettings() {
            if (closed) return;
            var w = new Window("dialog", "AfterPlaylist Settings");
            w.orientation = "column";
            w.alignChildren = ["fill", "top"];
            w.spacing = 10;
            w.margins = 16;
            paint(w, bg, white);

            label(w, "PLAYBACK SETTINGS", 10, accent, true);

            var pollRow = w.add("group");
            pollRow.orientation = "row";
            pollRow.alignChildren = ["left", "center"];
            var pollLabel = label(pollRow, "Poll interval", 10, white, false);
            pollLabel.preferredSize.width = 150;
            var pollDrop = pollRow.add("dropdownlist", undefined, ["3 seconds", "6 seconds", "10 seconds", "15 seconds"]);
            var pollIndex = pollSeconds === 3 ? 0 : pollSeconds === 10 ? 2 : pollSeconds === 15 ? 3 : 1;
            pollDrop.selection = pollIndex;

            var compactCheck = w.add("checkbox", undefined, "Start in Compact Mode");
            compactCheck.value = startCompact;
            var scrollCheck = w.add("checkbox", undefined, "Scroll long track names");
            scrollCheck.value = scrollEnabled;
            var footerCheck = w.add("checkbox", undefined, "Show status footer");
            footerCheck.value = showFooter;

            var note = label(w, "Settings are saved for the next launch.", 9, muted, false);
            note.alignment = ["fill", "center"];

            var buttons = w.add("group");
            buttons.orientation = "row";
            buttons.alignment = ["right", "center"];
            var cancelBtn = buttons.add("button", undefined, "Cancel");
            var saveBtn = buttons.add("button", undefined, "Save");
            styleBtn(cancelBtn, "utility", 28);
            styleBtn(saveBtn, "primary", 28);

            cancelBtn.onClick = function() { w.close(); };
            saveBtn.onClick = function() {
                var selected = pollDrop.selection ? pollDrop.selection.index : 1;
                pollSeconds = selected === 0 ? 3 : selected === 2 ? 10 : selected === 3 ? 15 : 6;
                startCompact = compactCheck.value;
                scrollEnabled = scrollCheck.value;
                showFooter = footerCheck.value;
                savePreference("pollSeconds", pollSeconds);
                savePreference("startCompact", startCompact);
                savePreference("scrollEnabled", scrollEnabled);
                savePreference("showFooter", showFooter);
                footer.visible = showFooter && !isCompact;
                if (fT) {
                    app.cancelTask(fT);
                    fT = app.scheduleTask("$.global.__apFetch()", pollSeconds * 1000, true);
                }
                setStatus("Settings saved");
                panel.layout.layout(true);
                w.close();
            };
            w.center();
            w.show();
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
            } catch (e) { setError("E301", "Spotift launch failed: " + e.message): }
        }

        function runDiagnostics() {
            var ps = new File("C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe");
            var ws = new File("C:/Windows/System32/wscript.exe");
            try {
                if (!ps.exists || !ws.exists) {
                    setError("E101", "Sytem files are missing");
                    return;
                }
                setStatus("System ready");
            } catch (e) {
                setError("E102", "Diagnostics failed: " + e.message);
            }
        }

        function fetchNowPlaying() {
            if (closed || isFetchingNP) return;
            isFetchingNP = true;
            fetchStartedAt = new Date().getTime();
            setPlaybackState("FETCHING", [0.95, 0.75, 0.20], "Checking the active media session...");
            var id = "np_" + String(new Date().getTime());
            var sF = tempFile("ap_np_" + id + ".ps1"), lF = tempFile("ap_np_" + id + ".vbs");
            var s = ["$ErrorActionPreference = 'Stop'", "try {", " Add-Type -AssemblyName System.Runtime.WindowsRuntime", " $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]", " function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; return $t.Result }", " $mType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]", " $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) $mType", " $s = $mgr.GetCurrentSession()", " if ($s) { $pType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]; $p = Await ($s.TryGetMediaPropertiesAsync()) $pType; $res = $p.Artist + ' - ' + $p.Title } else { $res = 'Nothing playing' }", " Set-Content -Path " + psQuote(npFile.fsName) + " -Value $res -Encoding UTF8", "} catch { Set-Content -Path " + psQuote(npFile.fsName) + " -Value 'ERROR' -Encoding UTF8 }", "Remove-Item -LiteralPath " + psQuote(sF.fsName) + " -Force; Remove-Item -LiteralPath " + psQuote(lF.fsName) + " -Force"].join("\r\n");
            var l = ["Dim sh: Set sh = CreateObject(\"WScript.Shell\")", "cmd = \"powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \" & Chr(34) & " + vbsQuote(sF.fsName) + " & Chr(34)", "sh.Run cmd, 0, False"].join("\r\n");
            writeFile(sF, s); writeFile(lF, l); system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(lF.fsName));
        }

        function checkNowPlaying() {
            if (closed) return;
            if (!npFile.exists) {
                if (isFetchingNP && fetchStartedAt && (new Date().getTime() - fetchStartedAt) > FETCH_TIMEOUT) {
                    isFetchingNP = false;
                    setPlaybackState("ERROR", [0.95, 0.25, 0.25], "E402");
                    setError("E402", "Now-playing request timed out");
                }
                return;
            }
            try {
                var c = readFile(npFile);
                npFile.remove();
                isFetchingNP = false;
               if (c === "ERROR") {
                songInfo.text = "Playback info unavailable";
                setPlaybackState("ERROR", [0.95, 0.25, 0.25], "E401");
                setError("E401", "Media session error");
               }
                } else if (c === "Nothing playing") {
                    fullSongText = "";
                    songInfo.text = "Nothing is currently playing";
                    setPlaybackState("NOT PLAYING", muted, "No active track");
                } else if (c) {
                    if (c !== fullSongText) { fullSongText = c; scrollIndex = 0; }
                    songInfo.text = fullSongText;
                    setPlaybackState("NOW PLAYING", accent, "Active track detected");
                }
                panel.layout.layout(true);
            } catch (e) {
                isFetchingNP = false;
                setPlaybackState("ERROR", [0.95, 0.25, 0.25], "E403");
                setError("E403", "Now-Playing read error: " + e.message);
            }
        }

        function scrollText() {
            if (closed || !scrollEnabled || isCompact || !fullSongText || fullSongText.length <= LIMIT) { if(fullSongText && !isCompact) songInfo.text = fullSongText; return; }
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
        btnSettings.onClick = openSettings;

        if (!showFooter) footer.visible = false;
        if (startCompact) toggleCompact();

        $.global.__apPoll = checkNowPlaying; $.global.__apFetch = fetchNowPlaying; $.global.__apScroll = scrollText;
        var pT = app.scheduleTask("$.global.__apPoll()", 1000, true);
        var fT = app.scheduleTask("$.global.__apFetch()", pollSeconds * 1000, true);
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
