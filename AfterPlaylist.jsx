/*
    AfterPlaylist Media Only v1.0
    Windows-only After Effects ScriptUI panel.
*/
(function (thisObj) {
    var VOLUME_STEPS = 2;
    var COMMAND_TIMEOUT_MS = 10000;

    function tempFile(name) {
        return new File(Folder.temp.fsName + "/" + name);
    }

    function psQuote(value) {
      
        return "'" + String(value).replace(/'/g, "''") + "'";
    }

    function cmdQuote(value) {
      
        return "\"" + String(value).replace(/\"/g, "\\\"") + "\"";
    }

    function writeFile(file, text) {
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            throw new Error("Cannot create temporary PowerShell file.");
        }
        file.write(text);
        file.close();
    }

    function readFile(file) {
        var text = "";
        file.encoding = "UTF-8";
        if (!file.open("r")) {
            throw new Error("Cannot read PowerShell response.");
        }
        text = file.read();
        file.close();
        return String(text).replace(/^\uFEFF/, "").replace(/^\s+|\s+$/g, "");
    }

    function vbsQuote(value) {
        return "\"" + String(value).replace(/\"/g, "\"\"") + "\"";
    }

    // runMediaCommand

    function runMediaCommand(vkCode, count) {
        var id = String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 100000));
        var scriptFile = tempFile("AfterPlaylist_media_" + id + ".ps1");
        var launcherFile = tempFile("AfterPlaylist_media_" + id + ".vbs");
        var script = [
            "$ErrorActionPreference = 'Stop'",
            "try {",
            "    Add-Type @'",
            "using System;",
            "using System.Runtime.InteropServices;",
            "public static class AfterPlaylistNativeKeyboard {",
            "    [DllImport(\"user32.dll\", SetLastError=true)]",
            "    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);",
            "    public const uint KEYEVENTF_KEYUP = 0x0002;",
            "}",
            "'@",
            "    $key = [byte]" + String(vkCode),
            "    $count = [int]" + String(count || 1),
            "    for ($i = 0; $i -lt $count; $i++) {",
            "        [AfterPlaylistNativeKeyboard]::keybd_event($key, 0, 0, [UIntPtr]::Zero)",
            "        Start-Sleep -Milliseconds 15",
            "        [AfterPlaylistNativeKeyboard]::keybd_event($key, 0, [AfterPlaylistNativeKeyboard]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)",
            "        Start-Sleep -Milliseconds 15",
            "    }",
            "} catch {",
            "    # Media commands are intentionally fire-and-forget.",
            "}",
            "Start-Sleep -Milliseconds 100",
            "Remove-Item -LiteralPath " + psQuote(scriptFile.fsName) + " -Force -ErrorAction SilentlyContinue",
            "Remove-Item -LiteralPath " + psQuote(launcherFile.fsName) + " -Force -ErrorAction SilentlyContinue"
        ].join("\r\n") + "\r\n";
        var launcher = [
            "Dim sh",
            "Set sh = CreateObject(\"WScript.Shell\")",
            "cmd = " + vbsQuote("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File ") + " & Chr(34) & " + vbsQuote(scriptFile.fsName) + " & Chr(34)",
            "sh.Run cmd, 0, False",
            "Set sh = Nothing"
        ].join("\r\n") + "\r\n";

        writeFile(scriptFile, script);
        writeFile(launcherFile, launcher);
      
        system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(launcherFile.fsName));
    }

    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "AfterPlaylist", undefined, { resizable: true });
        var bg = [0.12, 0.12, 0.12];
        var card = [0.16, 0.16, 0.16];
        var cardAlt = [0.20, 0.20, 0.20];
        var accent = [0.38, 0.66, 0.46];
        var white = [0.88, 0.88, 0.88];
        var muted = [0.62, 0.62, 0.62];
       
        var npFile = tempFile("afterplaylist_np.txt");
        var isFetching = false;
        var fullSongText + "";
        var scrollIndex = 0;
        var SCROLL_CHAR_LIMIT = 30;

        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 10;
        panel.margins = 14;
        panel.preferredSize = [390, 260];
        panel.minimumSize = [330, 230];

        function brush(control, color) {
            try { control.graphics.backgroundColor = control.graphics.newBrush(control.graphics.BrushType.SOLID_COLOR, color); } catch (e) {}
        }
        function pen(control, color) {
            try { control.graphics.foregroundColor = control.graphics.newPen(control.graphics.PenType.SOLID_COLOR, color, 1); } catch (e) {}
        }
        function paint(control, background, foreground) {
            brush(control, background);
            pen(control, foreground);
        }
        function label(parent, text, size, color) {
            var item = parent.add("statictext", undefined, text);
            item.graphics.font = ScriptUI.newFont("Segoe UI", "REGULAR", size);
            pen(item, color);
            return item;
        }
        function buttonStyle(button, background, foreground, size) {
            button.preferredSize.height = size || 34;
            button.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 10);
            paint(button, background, foreground);
        }
        function divider(parent) {
            var line = parent.add("panel");
            line.preferredSize.height = 1;
            brush(line, [0.16, 0.19, 0.21]);
            return line;
        }

        paint(panel, bg, white);

        // Header
        var header = panel.add("group");
        header.orientation = "row";
        header.alignChildren = ["left", "center"];
        header.spacing = 10;
        var mark = header.add("panel");
        mark.preferredSize = [8, 34];
        brush(mark, accent);
        var titleColumn = header.add("group");
        titleColumn.orientation = "column";
        titleColumn.alignChildren = ["left", "top"];
        titleColumn.spacing = 1;
        var title = label(titleColumn, "AfterPlaylist", 15, white);
        title.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 15);
        var subtitle = label(titleColumn, "MEDIA CONTROLS", 8, muted);
        var songInfo = label(titleColumn, "Fetching track...", 9, muted);
        songInfo.alignment = ["fill", "top"]
        var badge = header.add("statictext", undefined, "  READY  ");
        badge.alignment = "right";
        badge.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 8);
        paint(badge, cardAlt, muted);

        divider(panel);

        // Playback card
        var playbackPanel = panel.add("panel");
        playbackPanel.orientation = "column";
        playbackPanel.alignChildren = ["fill", "top"];
        playbackPanel.margins = [12, 12, 12, 12];
        playbackPanel.spacing = 8;
        paint(playbackPanel, card, white);
        var playbackLabel = label(playbackPanel, "PLAYBACK", 9, accent);
        playbackLabel.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 9);
        var playbackRow = playbackPanel.add("group");
        playbackRow.orientation = "row";
        playbackRow.alignChildren = ["fill", "center"];
        playbackRow.spacing = 7;
        var btnPrevious = playbackRow.add("button", undefined, "Previous");
        var btnPlayPause = playbackRow.add("button", undefined, "Play / Pause");
        var btnNext = playbackRow.add("button", undefined, "Next");
        btnPrevious.alignment = ["fill", "center"];
        btnPlayPause.alignment = ["fill", "center"];
        btnNext.alignment = ["fill", "center"];
        btnPrevious.minimumSize = [70, 40];
        btnPlayPause.minimumSize = [120, 44];
        btnNext.minimumSize = [70, 40];
        buttonStyle(btnPrevious, cardAlt, white, 40);
        buttonStyle(btnPlayPause, cardAlt, white, 44);
        buttonStyle(btnNext, cardAlt, white, 40);

        // Volume card
        var volumePanel = panel.add("panel");
        volumePanel.orientation = "column";
        volumePanel.alignChildren = ["fill", "top"];
        volumePanel.margins = [12, 12, 12, 12];
        volumePanel.spacing = 8;
        paint(volumePanel, card, white);
        var volumeLabel = label(volumePanel, "SYSTEM VOLUME", 9, accent);
        volumeLabel.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 9);
        var volumeRow = volumePanel.add("group");
        volumeRow.orientation = "row";
        volumeRow.alignChildren = ["fill", "center"];
        volumeRow.spacing = 7;
        var btnVolumeDown = volumeRow.add("button", undefined, "Volume Down ");
        var btnMute = volumeRow.add("button", undefined, "Mute");
        var btnVolumeUp = volumeRow.add("button", undefined, "Volume Up");
        buttonStyle(btnVolumeDown, cardAlt, white, 34);
        buttonStyle(btnMute, cardAlt, white, 34);
        buttonStyle(btnVolumeUp, cardAlt, white, 34);

        var statusRow = panel.add("group");
        statusRow.orientation = "row";
        statusRow.alignChildren = ["left", "center"];
        statusRow.spacing = 6;
        var statusDot = statusRow.add("statictext", undefined, "●");
        statusDot.graphics.font = ScriptUI.newFont("Segoe UI", "REGULAR", 10);
        pen(statusDot, accent);
        var statusText = label(statusRow, "Ready", 9, muted);
        var diagnosticsRow = panel.add("group");
        diagnosticsRow.orientation = "row";
        diagnosticsRow.alignChildren = ["right", "center"];
        var btnDiagnostics = diagnosticsRow.add("button", undefined, "Test Startup");
        btnDiagnostics.preferredSize = [92, 24];
        btnDiagnostics.graphics.font = ScriptUI.newFont("Segoe UI", "REGULAR", 9);
        var closed = false;
        var commandLocked = false;
        var lastCommandAt = 0;
        var CLICK_COOLDOWN_MS = 700;
        var controls = [btnPrevious, btnPlayPause, btnNext, btnVolumeDown, btnMute, btnVolumeUp];

        function setStatus(text) {
            if (!closed) statusText.text = text;
        }
        function runDiagnostics() {
            var ps = new File("C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe");
            var ws = new File("C:/Windows/System32/wscript.exe");
            var probe = tempFile("AfterPlaylist_diagnostic.txt");
            try {
                if ($.os.toLowerCase().indexOf("windows") === -1) {
                    setStatus("Setup error: Windows is required");
                    return;
                }
                if (!ps.exists) {
                    setStatus("Setup error: Powershell not found");
                    return;
                }
                if (!ws.exists) {
                    setStatus("Setup error: WScript not found");
                    return;
                }
                writeFile(probe, "AfterPlaylist OK");
                if (!probe.exists) {
                    setStatus("Setup error: temp folder is not writable");
                    return;
                }
                setStatus("Setup success: Powershell, WScript, and temp access are functiona; :D")
            } catch (e) {
                setStatus("Setup error:" + (e.message || String(e)));
            } finally {
                try { if (probe.exists) probe.remove(); } catch (ignoreProbe) {}
            }

        }

        function fetchNowPlaying() {
            if (closed || isFetchingNP) return;
            isFetchingNP = true;
            var id = "np_" + String(new Date().getTime());
            var scriptFile = tempFile("AfterPlaylist_" + id + ".ps1");
            var launcherFile = tempFile("AfterPlaylist_" + id + ".vbs");

            var script = [
                "$ErrorActionPreference = 'Stop'",
                "try {",
                "   Add-Type -AssemblyName System.Runtime.WindowsRuntime",
                "   $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]",
                "function Await($op, $type) {",
                "       $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))",
                "       $task.Wait(-1) | Out-Null",
                "       return $task.Result",
                "   }",
                "   $mType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]",
                "   $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) $mType",
                "   $session = $manager.GetCurrentSession()",
                "   if ($session) {",
                "       $pType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]",
                "        $props = Await ($session.TryGetMediaPropertiesAsync()) $pType",
                "   $res = $props.Artist + ' - ' + $props.Title",
                "   } else { $res = 'Nothing playing' }",
                "    Set-Content -Path " + psQuote(npFile.fsName) + " -Value $res -Encoding UTF8",
                "} catch { Set-Content -Path " + psQuote(npFile.fsName) + " -Value 'Nothing playing' -Encoding UTF8 }",
                "Remove-Item -LiteralPath " + psQuote(scriptFile.fsName) + " -Force",
                "Remove-Item -LiteralPath " + psQuote(launcherFile.fsName) + " -Force"

            ].join ("\r\n") + "\r\n";

            var launcher = [
                "Dim sh",
                "Set sh = CreateObject(\"WScript.Shell\")",
                "cmd = " + vbsQuote("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File ") + " & Chr(34) & " + vbsQuote(scriptFile.fsName) + " & Chr(34)",
                "sh.Run cmd, 0, False",
                "Set sh = Nothing"
            ].join("\r\n") + "\r\n";

            writeFile(scriptFile, script);
            writeFile(launcherFile, launcher);
            system.callSystem("wscript.exe //B //NoLogo " + cmdQuote(launcherFile.fsName));
        }

        


        function send(vkCode, count, description) {
            var now;
            var i;
            if (closed) return;
            now = new Date().getTime();
            if (commandLocked || (now - lastCommandAt) < CLICK_COOLDOWN_MS) {
                setStatus("Please wait...");
                return;
            }
            commandLocked = true;
            lastCommandAt = now;
            badge.text = "  WORKING  ";
            paint(badge, cardAlt, muted);
            for (i = 0; i < controls.length; i++) controls[i].enabled = false;
            try {
                setStatus("Sending " + description + "...");
                runMediaCommand(vkCode, count);
                setStatus("Sent: " + description);
            } catch (e) {
                setStatus("Error: " + (e.message || String(e)));
            } finally {
                commandLocked = false;
                badge.text = "  READY  ";
                paint(badge, cardAlt, muted);
                for (i = 0; i < controls.length; i++) controls[i].enabled = true;
            }
            panel.layout.layout(true);
        }

        // Windows virtual-key codes
        btnPlayPause.onClick = function () { send(0xB3, 1, "Play / Pause"); };
        btnPrevious.onClick = function () { send(0xB1, 1, "Previous track"); };
        btnNext.onClick = function () { send(0xB0, 1, "Next track"); };
        btnMute.onClick = function () { send(0xAD, 1, "Mute toggle"); };
        btnVolumeDown.onClick = function () { send(0xAE, VOLUME_STEPS, "Volume down"); };
        btnVolumeUp.onClick = function () { send(0xAF, VOLUME_STEPS, "Volume up"); };
        btnDiagnostics.onClick = runDiagnostics;
        panel.onClose = function () {
            closed = true;
        };
        panel.onResizing = panel.onResize = function () {
            this.layout.resize();
        };

        panel.layout.layout(true);
        return panel;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) {
        ui.center();
        ui.show();
    }
})(this);
