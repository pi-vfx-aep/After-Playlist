/*
    AfterPlaylist v1.0
    Windows-only After Effects ScriptUI panel.

    This version sends standard Windows media-key events only.
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

    function runMediaCommand(vkCode, count) {
       var id = String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 100000));
       var scriptFile = tempFile("AfterPlaylist_media" + id + ".ps1");
       var wrapperFile = tempFile("AfterPlaylist_media_" + id + ".cmd");
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
        "    # Fire-and-forget: do not send errors back through the AE UI thread.",
        "}",
        "Start-Sleep -Milliseconds 100",
        "Remove-Item -LiteralPath " + psQuote(scriptFile.fsName) + " -Force -ErrorAction SilentlyContinue",
        "Remove-Item -LiteralPath " + psQuote(wrapperFile.fsName) + " -Force -ErrorAction SilentlyContinue"
       ].join("\r\n") + "\r\n";
       var wrapper = [
        "@echo off",
        "setLocal",
        "set \"PS=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"",
        "\"%PS%\" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowsStyle Hidden -File" + cmdQuote(scriptFile.fsName),
        "endlocal",
        "exit /b 0"
       ].join("\r\n") + "\r\n";

       writeFile(scriptFile, script);
       writeFile(wrapperFile, wrapper):


       system.callSystem("cmd.exe /d /c start \"\" /b " + cmdQuote(wrapperFile.fsName));
    }

    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "AfterPlaylist", undefined, { resizable: true });
        var bg = [0.12, 0.12, 0.12];
        var card = [0.16, 0.16, 0.16];
        var cardAlt = [0.20, 0.20, 0.20];
        var accent = [0.38, 0.66, 0.46];
        var white = [0.88, 0.88, 0.88];
        var muted = [0.62, 0.62, 0.62];

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
        var title = label(titleColumn, "AfterPlaylist", 15, white)
        title.graphics.font = ScriptUI.newFont("Segoe UI", "BOLD", 15);
        var subtitle = label(titleColumn, "MEDIA CONTROLS", 8, muted)
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
        var btnPrevious = playbackRow.add("button", undefined, "PREV");
        var btnPlayPause = playbackRow.add("button", undefined, "PLAY / PAUSE");
        var btnNext = playbackRow.add("button", undefined, "NEXT");
        btnPrevious.preferredSize = [82, 40];
        btnPlayPause.preferredSize = [148, 44];
        btnNext.preferredSize = [82, 40];
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
        var btnVolumeDown = volumeRow.add("button", undefined, "VOLUME -");
        var btnMute = volumeRow.add("button", undefined, "MUTE");
        var btnVolumeUp = volumeRow.add("button", undefined, "VOLUME +");
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
        var closed = false;
        var commandLocked = false;
        var lastCommandAt = 0;
        var CLICK_COOLDOWN_MS = 700;
        var controls = [btnPrevious, btnPlayPause, btnNext, btnVolumeDown, btnMute, btnVolumeUp];

        function setStatus(text) {
            if (!closed) statusText.text = text;
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
            badge.text = "  BUSY  ";
            paint(badge, [0.23, 0.19, 0.08], [1.0, 0.78, 0.30]);
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

        // Windows virtual-key codes: next, previous, play/pause, mute, volume down/up.
        btnPlayPause.onClick = function () { send(0xB3, 1, "Play / Pause"); };
        btnPrevious.onClick = function () { send(0xB1, 1, "Previous track"); };
        btnNext.onClick = function () { send(0xB0, 1, "Next track"); };
        btnMute.onClick = function () { send(0xAD, 1, "Mute toggle"); };
        btnVolumeDown.onClick = function () { send(0xAE, VOLUME_STEPS, "Volume down"); };
        btnVolumeUp.onClick = function () { send(0xAF, VOLUME_STEPS, "Volume up"); };

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
