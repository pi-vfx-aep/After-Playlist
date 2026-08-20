(function(thisObj) {


    // CONFIG - Optimizations for Spotify & AE Performance
  
    var SEEK_STEPS = 2;          
    var VOL_STEPS = 2;           
    var AUTO_REFRESH_MS = 10000; 

  // NOW PLAYING

    function getTempFile(name) {
        return new File(Folder.temp.fsName + "/" + name);
    }

    function writeNowPlayingScript(ps1File, outFile) {
        var lines = [
            '$outPath = "' + outFile.fsName + '"',
            '$result = ""',
            'try {',
            '    Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null',
            '    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {',
            '        $_.Name -eq \'AsTask\' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq \'IAsyncOperation`1\'',
            '    })[0]',
            '    function Await($WinRtTask, $ResultType) {',
            '        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)',
            '        $netTask = $asTask.Invoke($null, @($WinRtTask))',
            '        $netTask.Wait(-1) | Out-Null',
            '        $netTask.Result',
            '    }',
            '    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null',
            '    $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])',
            '    $session = $manager.GetCurrentSession()',
            '    if ($null -eq $session) {',
            '        $result = "NONE|No active media session"',
            '    } else {',
            '        $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])',
            '        $playback = $session.GetPlaybackInfo()',
            '        $status = $playback.PlaybackStatus.ToString()',
            '        if ([string]::IsNullOrWhiteSpace($props.Title)) {',
            '            $result = "NONE|No track information"',
            '        } else {',
            '            $result = "$status|$($props.Artist) - $($props.Title)"',
            '        }',
            '    }',
            '} catch {',
            '    $result = "ERROR|$($_.Exception.Message)"',
            '}',
            '$result | Out-File -FilePath $outPath -Encoding utf8 -Force'
        ];
        ps1File.encoding = "UTF-8";
        ps1File.open("w");
        ps1File.write(lines.join("\n"));
        ps1File.close();
    }

    function waitForFile(file, timeoutMs) {
        var start = new Date().getTime();
        while (!file.exists) {
            if (new Date().getTime() - start > timeoutMs) return false;
            $.sleep(50);
        }
        return true;
    }

    function readAndParse(file) {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        if (content === null) content = "";
        content = content.replace(/^\s+|\s+$/g, "");
        var pipeIndex = content.indexOf("|");
        if (pipeIndex === -1) return { status: "ERROR", text: content || "Empty response" };
        return { status: content.substring(0, pipeIndex), text: content.substring(pipeIndex + 1) };
    }

    function fetchNowPlaying(callback) {
        try {
            var ps1 = getTempFile("afterPlaylist_nowPlaying.ps1");
            var out = getTempFile("afterPlaylist_nowPlaying.txt");
            if (out.exists) out.remove();
            writeNowPlayingScript(ps1, out);
            app.system('powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + ps1.fsName + '"');
            if (!waitForFile(out, 4000)) {
                callback({ status: "ERROR", text: "Timed out waiting for PowerShell" });
                return;
            }
            $.sleep(100);
            callback(readAndParse(out));
        } catch (e) {
            callback({ status: "ERROR", text: e.toString() });
        }
    }

   
    // UI
   
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "After Playlist", undefined, { resizable: true });
        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 8;
        panel.margins = 12;
        panel.preferredSize.width = 320;

        if ($.os.toLowerCase().indexOf("windows") === -1) {
            var warn = panel.add("statictext", undefined, "⚠ This panel uses PowerShell and only works on Windows.", { multiline: true });
            warn.preferredSize = [290, 30];
        }

        // ----- Now Playing -----
        var nowPlayingPanel = panel.add("panel", undefined, "Now Playing");
        nowPlayingPanel.orientation = "column";
        nowPlayingPanel.alignChildren = ["fill", "top"];
        nowPlayingPanel.margins = [10, 16, 10, 10];
        nowPlayingPanel.spacing = 6;

        var songText = nowPlayingPanel.add("statictext", undefined, "Press Refresh to check…", { multiline: true });
        songText.preferredSize = [290, 32];

        var npRow = nowPlayingPanel.add("group");
        npRow.orientation = "row";
        npRow.alignChildren = ["left", "center"];
        var btnRefresh = npRow.add("button", undefined, "🔄 Refresh");
        btnRefresh.helpText = "Fetch the currently playing track";
        var chkAuto = npRow.add("checkbox", undefined, "Auto (every " + (AUTO_REFRESH_MS / 1000) + "s)");
        chkAuto.helpText = "Automatically refresh now-playing info";

        // ----- Playback -----
        var playbackPanel = panel.add("panel", undefined, "Playback");
        playbackPanel.orientation = "row";
        playbackPanel.alignChildren = ["center", "center"];
        playbackPanel.margins = [10, 16, 10, 10];

        var btnRewind = playbackPanel.add("button", undefined, "⏪ 10s");
        var btnPrev = playbackPanel.add("button", undefined, "⏮");
        var btnPlay = playbackPanel.add("button", undefined, "⏯");
        var btnNext = playbackPanel.add("button", undefined, "⏭");
        var btnForward = playbackPanel.add("button", undefined, "⏩ 10s");

        btnRewind.helpText = "Seek back ~10s";
        btnPrev.helpText = "Previous track";
        btnPlay.helpText = "Play / Pause";
        btnNext.helpText = "Next track";
        btnForward.helpText = "Seek forward ~10s";

        // ----- Volume -----
        var volumePanel = panel.add("panel", undefined, "Volume");
        volumePanel.orientation = "row";
        volumePanel.alignChildren = ["center", "center"];
        volumePanel.margins = [10, 16, 10, 10];

        var btnVolDown = volumePanel.add("button", undefined, "🔉 Vol -");
        var btnMute = volumePanel.add("button", undefined, "🔇 Mute");
        var btnVolUp = volumePanel.add("button", undefined, "🔊 Vol +");

        btnVolDown.helpText = "Lower system volume";
        btnMute.helpText = "Toggle mute";
        btnVolUp.helpText = "Raise system volume";

        // ----- Status bar -----
        var statusText = panel.add("statictext", undefined, "Ready");
        try {
            statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, [0.55, 0.55, 0.55], 1);
        } catch (e) { /* color customization handling */ }

        function setStatus(msg) { statusText.text = msg; }

        // ----- Refresh logic -----
        var isRefreshing = false;
        function doRefresh() {
            if (isRefreshing) return;
            isRefreshing = true;
            setStatus("Fetching now playing…");
            fetchNowPlaying(function(result) {
                isRefreshing = false;
                if (result.status === "ERROR") {
                    songText.text = "⚠ " + result.text;
                    setStatus("Error fetching now playing");
                } else if (result.status === "NONE") {
                    songText.text = "— " + result.text + " —";
                    setStatus("Ready");
                } else {
                    var icon = (result.status === "Playing") ? "▶" : "⏸";
                    songText.text = icon + " " + result.text;
                    setStatus("Ready");
                }
                panel.layout.layout(true);
            });
        }

        function refreshSoon() {
            app.scheduleTask("$.global.__afterPlaylistRefresh && $.global.__afterPlaylistRefresh()", 600, false);
        }

        var autoLoopArmed = false;
        function armAutoLoop() {
            if (autoLoopArmed) return;
            autoLoopArmed = true;
            app.scheduleTask("$.global.__afterPlaylistAutoTick && $.global.__afterPlaylistAutoTick()", AUTO_REFRESH_MS, false);
        }

        // Standardized global scope naming
        $.global.__afterPlaylistRefresh = doRefresh;
        $.global.__afterPlaylistAutoTick = function() {
            autoLoopArmed = false;
            if (!chkAuto.value) return;
            doRefresh();
            armAutoLoop();
        };

        // ----- Media key helpers -----
        function sendMediaKey(vkCode) {
            var psCommand = 'powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]' + vkCode + ')"';
            app.system(psCommand);
        }
        function sendRepeatedKey(vkCode, count) {
            var psCommand = 'powershell -c "$wshell = New-Object -ComObject wscript.shell; for($i=0;$i -lt ' + count + ';$i++){ $wshell.SendKeys([char]' + vkCode + ') }"';
            app.system(psCommand);
        }

        // Event Assignments
        btnPlay.onClick = function() { sendMediaKey("0xCD"); setStatus("Sent: Play / Pause"); refreshSoon(); };
        btnNext.onClick = function() { sendMediaKey("0xB0"); setStatus("Sent: Next track"); refreshSoon(); };
        btnPrev.onClick = function() { sendMediaKey("0xB1"); setStatus("Sent: Previous track"); refreshSoon(); };
        btnMute.onClick = function() { sendMediaKey("0xAD"); setStatus("Sent: Mute toggle"); };
        btnRewind.onClick = function() { sendRepeatedKey("0x25", SEEK_STEPS); setStatus("Sent: Seek back"); };
        btnForward.onClick = function() { sendRepeatedKey("0x27", SEEK_STEPS); setStatus("Sent: Seek forward"); };
        btnVolDown.onClick = function() { sendRepeatedKey("0xAE", VOL_STEPS); setStatus("Sent: Volume down"); };
        btnVolUp.onClick = function() { sendRepeatedKey("0xAF", VOL_STEPS); setStatus("Sent: Volume up"); };

        btnRefresh.onClick = doRefresh;
        chkAuto.onClick = function() {
            if (chkAuto.value) { doRefresh(); armAutoLoop(); }
        };

        panel.onClose = function() {
            chkAuto.value = false;
        };

        doRefresh();

        panel.layout.layout(true);
        return panel;
    }

    var scriptUI = buildUI(thisObj);
    if (scriptUI instanceof Window) {
        scriptUI.center();
        scriptUI.show();
    }
})(this);