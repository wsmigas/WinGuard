import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const downloadsRouter = Router();

// Endpoint to generate and download the PowerShell Windows Agent script
downloadsRouter.get('/agent.ps1', (req: Request, res: Response) => {
  const serverUrl = (req.query.serverUrl as string) || 'http://192.168.1.150:3000';
  const deviceId = (req.query.deviceId as string) || 'dev-win11-quarto';
  const monitoredUser = ((req.query.monitoredUser as string) || 'pedro').toLowerCase();

  const scriptContent = `# =====================================================================
# WinGuard Parental Control - Windows 10/11 Client Agent
# Managed centrally via Proxmox LXC Server
# =====================================================================
# Requires Administrator privileges to update hosts file and enforce rules.
# Monitors ONLY the target child user: "${monitoredUser}"
# =====================================================================

param (
    [string]$ServerUrl = "${serverUrl}",
    [string]$DeviceId = "${deviceId}",
    [string]$TargetUser = "${monitoredUser}"
)

# ----------------- Configuration & Paths -----------------
$BaseDir = "C:\\ProgramData\\WinGuard"
if (-not (Test-Path $BaseDir)) {
    New-Item -Path $BaseDir -ItemType Directory -Force | Out-Null
}

$ConfigCacheFile = "$BaseDir\\local-config.json"
$StateFile       = "$BaseDir\\local-state.json"
$HostsFile       = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"
$LogFile         = "$BaseDir\\agent.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$ts] [$Level] $Message"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

Write-Log "WinGuard Agent iniciado. Servidor: $ServerUrl | Dispositivo: $DeviceId | Alvo: $TargetUser"

# ----------------- Windows API: Idle & Foreground Detection -----------------
$Win32TypeDef = @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [DllImport("user32.dll")]
    public static extern bool LockWorkStation();
}
"@

Add-Type -TypeDefinition $Win32TypeDef -ErrorAction SilentlyContinue

function Get-UserIdleSeconds {
    $lii = New-Object Win32+LASTINPUTINFO
    $lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)
    if ([Win32]::GetLastInputInfo([ref]$lii)) {
        $uptimeMs = [Environment]::TickCount
        $idleMs = $uptimeMs - $lii.dwTime
        return [Math]::Max(0, [int]($idleMs / 1000))
    }
    return 0
}

function Get-ForegroundProcessInfo {
    $hwnd = [Win32]::GetForegroundWindow()
    if ($hwnd -eq [IntPtr]::Zero) { return @{ Name = ""; Title = "" } }
    $pidOut = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null
    if ($pidOut -gt 0) {
        $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        if ($p) {
            return @{
                Name = $p.ProcessName.ToLower() + ".exe"
                Title = $p.MainWindowTitle
            }
        }
    }
    return @{ Name = ""; Title = "" }
}

function Get-ActiveConsoleUser {
    try {
        # Check logged-in user on active console session
        $query = (query user 2>$null) | Out-String
        if ($query) {
            $lines = $query -split "\\r?\\n"
            foreach ($line in $lines) {
                if ($line -match ">?([a-zA-Z0-9_.-]+)\\s+(\\S+)?\\s+(\\d+)?\\s+Active") {
                    return $matches[1].ToLower().Trim('>')
                }
            }
        }
        $compSys = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
        if ($compSys -and $compSys.UserName) {
            $parts = $compSys.UserName -split "\\\\"
            return $parts[-1].ToLower()
        }
    } catch {}
    return ""
}

# ----------------- Local State Management (Offline Resilience) -----------------
function Load-LocalState {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $default = @{
        DateKey = $today
        TotalActiveSeconds = 0
        AppSeconds = @{}
    }
    if (Test-Path $StateFile) {
        try {
            $json = Get-Content $StateFile -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
            if ($json.DateKey -eq $today) {
                # Convert PSCustomObject to hashtable
                $appHash = @{}
                if ($json.AppSeconds) {
                    $json.AppSeconds.PSObject.Properties | ForEach-Object { $appHash[$_.Name] = $_.Value }
                }
                return @{
                    DateKey = $today
                    TotalActiveSeconds = [int]$json.TotalActiveSeconds
                    AppSeconds = $appHash
                }
            }
        } catch {}
    }
    return $default
}

function Save-LocalState($state) {
    try {
        $json = $state | ConvertTo-Json -Depth 5
        Set-Content -Path $StateFile -Value $json -Force -ErrorAction SilentlyContinue
    } catch {}
}

# ----------------- Hosts File Management (Website Blocking) -----------------
function Update-HostsFile($hostsSnippet) {
    if (-not $hostsSnippet) { return }
    try {
        $startTag = "# ===== WINGUARD MANAGED BLOCKLIST START ====="
        $endTag   = "# ===== WINGUARD MANAGED BLOCKLIST END ====="

        $existing = ""
        if (Test-Path $HostsFile) {
            $existing = Get-Content $HostsFile -Raw -ErrorAction SilentlyContinue
        }

        $blockContent = "$startTag\`r\`n$hostsSnippet\`r\`n$endTag"

        if ($existing -match [regex]::Escape($startTag)) {
            $pattern = "(?s)" + [regex]::Escape($startTag) + ".*?" + [regex]::Escape($endTag)
            $newHosts = [regex]::Replace($existing, $pattern, $blockContent)
        } else {
            $newHosts = $existing + "\`r\`n\`r\`n" + $blockContent
        }

        Set-Content -Path $HostsFile -Value $newHosts -Force -Encoding ASCII
        Start-Process "ipconfig" -ArgumentList "/flushdns" -NoNewWindow -Wait
        Write-Log "Ficheiro hosts atualizado com sucesso. DNS flushed."
    } catch {
        Write-Log "Erro ao atualizar ficheiro hosts: $_" "ERROR"
    }
}

# ----------------- Server Sync & Heartbeat -----------------
$localConfig = $null
if (Test-Path $ConfigCacheFile) {
    try {
        $localConfig = Get-Content $ConfigCacheFile -Raw | ConvertFrom-Json
        Write-Log "Configuração local carregada da cache."
    } catch {}
}

# Pull initial config
function Sync-WithServer {
    try {
        $url = "$ServerUrl/api/agent/config/$DeviceId"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response -and $response.success) {
            $script:localConfig = $response
            Set-Content -Path $ConfigCacheFile -Value ($response | ConvertTo-Json -Depth 10) -Force
            Update-HostsFile $response.hostsSnippet
            
            # Acknowledge rules version
            $ackBody = @{ deviceId = $DeviceId; version = $response.rulesVersion } | ConvertTo-Json
            Invoke-RestMethod -Uri "$ServerUrl/api/agent/ack-rules" -Method Post -Body $ackBody -ContentType "application/json" -TimeoutSec 5 | Out-Null
            Write-Log "Sincronizado com o servidor com sucesso! Regras v$($response.rulesVersion)"
            return $true
        }
    } catch {
        Write-Log "Servidor offline ou inacessível. A operar com regras guardadas localmente." "WARN"
    }
    return $false
}

# First sync
Sync-WithServer | Out-Null

# ----------------- Main Enforcement Loop -----------------
$state = Load-LocalState
$loopIntervalSec = 5
$heartbeatCounter = 0

Write-Log "Loop de monitorização ativo (Verificação a cada 5 segundos)."

while ($true) {
    Start-Sleep -Seconds $loopIntervalSec
    $heartbeatCounter += $loopIntervalSec

    $currentUser = Get-ActiveConsoleUser
    $isMonitored = ($currentUser -eq $TargetUser.ToLower())

    # If current active user is not the child (e.g. parent/administrator), do not restrict!
    if (-not $isMonitored) {
        if ($heartbeatCounter -ge 30) {
            $heartbeatCounter = 0
            # Send periodic status to server
            try {
                $body = @{
                    deviceId = $DeviceId
                    activeUser = $currentUser
                    foregroundApp = ""
                    windowTitle = ""
                    uptimeMinutes = [int]((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalMinutes
                    activeMinutes = [int]($state.TotalActiveSeconds / 60)
                    isLocked = $false
                    appliedRulesVersion = if ($localConfig) { $localConfig.rulesVersion } else { 0 }
                } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ServerUrl/api/agent/heartbeat" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 4 | Out-Null
            } catch {}
        }
        continue
    }

    # User IS the monitored child:
    $idleSec = Get-UserIdleSeconds
    $isUserActive = ($idleSec -lt 120) # Active if interacted within last 2 minutes

    $fg = Get-ForegroundProcessInfo
    $activeApp = $fg.Name

    if ($isUserActive) {
        $state.TotalActiveSeconds += $loopIntervalSec
        if ($activeApp) {
            if (-not $state.AppSeconds.ContainsKey($activeApp)) {
                $state.AppSeconds[$activeApp] = 0
            }
            $state.AppSeconds[$activeApp] += $loopIntervalSec
        }
        Save-LocalState $state
    }

    # ----------------- Check Rules Enforcement -----------------
    if ($localConfig -and $localConfig.rules) {
        $rules = $localConfig.rules
        $isWeekend = ((Get-Date).DayOfWeek -eq [DayOfWeek]::Saturday -or (Get-Date).DayOfWeek -eq [DayOfWeek]::Sunday)
        $dailyLimitMinutes = if ($isWeekend) { $rules.globalDailyLimitMinutesWeekend } else { $rules.globalDailyLimitMinutesWeekday }
        $bonusMinutes = if ($rules.bonusMinutesToday) { [int]$rules.bonusMinutesToday } else { 0 }
        $totalAllowedMinutes = $dailyLimitMinutes + $bonusMinutes

        $usedMinutes = [int]($state.TotalActiveSeconds / 60)

        # 1. Curfew check
        $nowTime = (Get-Date).ToString("HH:mm")
        $curfew = $rules.curfew
        $inCurfew = $false
        if ($curfew -and $curfew.enabled) {
            $start = if ($isWeekend) { $curfew.weekendStartTime } else { $curfew.weekdayStartTime }
            $end   = if ($isWeekend) { $curfew.weekendEndTime } else { $curfew.weekdayEndTime }

            if ($start -and $end) {
                if ($start -gt $end) {
                    # Overnight (e.g. 21:30 to 07:30)
                    if ($nowTime -ge $start -or $nowTime -le $end) { $inCurfew = $true }
                } else {
                    if ($nowTime -ge $start -and $nowTime -le $end) { $inCurfew = $true }
                }
            }
        }

        # 2. Daily limit check
        if ($inCurfew -or ($usedMinutes -ge $totalAllowedMinutes)) {
            $reason = if ($inCurfew) { "Horário de recolher / descanso atingido." } else { "Tempo diário de computador esgotado ($totalAllowedMinutes min)." }
            Write-Log "BLOQUEIO DE SESSÃO: $reason" "WARN"
            
            # Lock workstation
            [Win32]::LockWorkStation() | Out-Null

            # Notify server
            try {
                $evtBody = @{
                    deviceId = $DeviceId
                    type = "pc_locked"
                    severity = "warning"
                    message = "Computador bloqueado localmente pelo agente: $reason"
                    details = @{ user = $currentUser; reason = $reason; usedMinutes = $usedMinutes }
                } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ServerUrl/api/agent/event" -Method Post -Body $evtBody -ContentType "application/json" -TimeoutSec 3 | Out-Null
            } catch {}
        }

        # 3. Application Rules check
        if ($rules.appRules -and $activeApp) {
            foreach ($appRule in $rules.appRules) {
                if ($appRule.executableName -and ($appRule.executableName.ToLower() -eq $activeApp)) {
                    $appUsedSec = if ($state.AppSeconds.ContainsKey($activeApp)) { $state.AppSeconds[$activeApp] } else { 0 }
                    $appUsedMin = [int]($appUsedSec / 60)

                    $shouldKill = $false
                    $killReason = ""

                    if ($appRule.status -eq "blocked") {
                        $shouldKill = $true
                        $killReason = "Aplicação permanentemente bloqueada pelos pais."
                    } elseif ($appRule.status -eq "limited" -and $appRule.dailyLimitMinutes -gt 0 -and ($appUsedMin -ge $appRule.dailyLimitMinutes)) {
                        $shouldKill = $true
                        $killReason = "Limite diário da aplicação atingido ($($appRule.dailyLimitMinutes) min)."
                    }

                    if ($shouldKill) {
                        Write-Log "A terminar aplicação proibida: $activeApp ($killReason)" "WARN"
                        Get-Process -Name ($activeApp -replace "\\.exe$","") -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                        
                        try {
                            $evtBody = @{
                                deviceId = $DeviceId
                                type = "app_killed"
                                severity = "warning"
                                message = "Aplicação fechada automaticamente: $activeApp ($killReason)"
                                details = @{ app = $activeApp; reason = $killReason; usedMinutes = $appUsedMin }
                            } | ConvertTo-Json
                            Invoke-RestMethod -Uri "$ServerUrl/api/agent/event" -Method Post -Body $evtBody -ContentType "application/json" -TimeoutSec 3 | Out-Null
                        } catch {}
                    }
                }
            }
        }
    }

    # ----------------- Periodic Heartbeat & Telemetry (every 30 sec) -----------------
    if ($heartbeatCounter -ge 30) {
        $heartbeatCounter = 0
        try {
            # Prepare telemetry delta list
            $deltas = @()
            foreach ($key in $state.AppSeconds.Keys) {
                $deltas += @{
                    executableName = $key
                    displayName = $key
                    minutes = [int]($state.AppSeconds[$key] / 60)
                }
            }

            $hbBody = @{
                deviceId = $DeviceId
                activeUser = $currentUser
                foregroundApp = $activeApp
                windowTitle = $fg.Title
                uptimeMinutes = [int]((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalMinutes
                activeMinutes = [int]($state.TotalActiveSeconds / 60)
                isLocked = $false
                appliedRulesVersion = if ($localConfig) { $localConfig.rulesVersion } else { 0 }
            } | ConvertTo-Json

            $hbResp = Invoke-RestMethod -Uri "$ServerUrl/api/agent/heartbeat" -Method Post -Body $hbBody -ContentType "application/json" -TimeoutSec 5
            
            # Send app telemetry
            if ($deltas.Count -gt 0) {
                $telBody = @{ deviceId = $DeviceId; appDeltas = $deltas } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ServerUrl/api/agent/telemetry" -Method Post -Body $telBody -ContentType "application/json" -TimeoutSec 5 | Out-Null
            }

            # Check if server issued remote commands
            if ($hbResp -and $hbResp.commands) {
                foreach ($cmd in $hbResp.commands) {
                    Write-Log "Comando remoto recebido: $($cmd.command)"
                    if ($cmd.command -eq "lock_now") {
                        [Win32]::LockWorkStation() | Out-Null
                    } elseif ($cmd.command -eq "bonus_time") {
                        Sync-WithServer | Out-Null
                    }
                }
            }

            # Check if new rules were configured on web dashboard
            if ($hbResp -and $hbResp.hasNewRules) {
                Write-Log "Novas regras detetadas no servidor. A transferir..."
                Sync-WithServer | Out-Null
            }
        } catch {
            Write-Log "Heartbeat falhou (computador offline). Operando autonomamente." "WARN"
        }
    }
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="WinGuard-Agent.ps1"');
  res.send(scriptContent);
});

// Endpoint to download the automated install.bat for Windows
downloadsRouter.get('/install.bat', (req: Request, res: Response) => {
  const serverUrl = (req.query.serverUrl as string) || 'http://192.168.1.150:3000';
  const deviceId = (req.query.deviceId as string) || 'dev-win11-quarto';
  const monitoredUser = ((req.query.monitoredUser as string) || 'pedro').toLowerCase();

  const lines = [
    '@echo off',
    ':: ====================================================================',
    ':: WinGuard Parental Control - Windows 10/11 Automated Installer',
    ':: Managed centrally via Proxmox LXC Server',
    ':: ====================================================================',
    '',
    'echo [WinGuard] A verificar privilegios de Administrador...',
    'net session >nul 2>&1',
    'if %errorlevel% neq 0 (',
    '    echo [ERRO] Este instalador necessita de ser executado como Administrador!',
    '    echo Clique com o botao direito no ficheiro e escolha "Executar como administrador".',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo.',
    'echo =======================================================',
    'echo          WinGuard Parental Control - Instalador',
    'echo =======================================================',
    `echo Servidor LXC: ${serverUrl}`,
    `echo ID do Computador: ${deviceId}`,
    `echo Utilizador a Monitorizar: ${monitoredUser}`,
    'echo =======================================================',
    'echo.',
    '',
    'set TARGET_DIR=C:\\ProgramData\\WinGuard',
    'if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"',
    '',
    'echo [1/4] A transferir o agente PowerShell do servidor WinGuard...',
    `powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${serverUrl}/api/download/agent.ps1?serverUrl=${encodeURIComponent(serverUrl)}&deviceId=${encodeURIComponent(deviceId)}&monitoredUser=${encodeURIComponent(monitoredUser)}' -OutFile '%TARGET_DIR%\\WinGuard-Agent.ps1'"`,
    '',
    'if not exist "%TARGET_DIR%\\WinGuard-Agent.ps1" (',
    '    echo [ERRO] Nao foi possivel transferir o agente do servidor. Verifique o IP e ligacao de rede.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo [2/4] A criar a tarefa agendada no Windows (SYSTEM com inicializacao automatica)...',
    'schtasks /delete /tn "WinGuard Parental Agent" /f >nul 2>&1',
    'schtasks /create /tn "WinGuard Parental Agent" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"%TARGET_DIR%\\WinGuard-Agent.ps1\\"" /sc onstart /ru SYSTEM /rl HIGHEST /f',
    '',
    'echo [3/4] A configurar arranque imediato...',
    'schtasks /run /tn "WinGuard Parental Agent"',
    '',
    'echo [4/4] Agente instalado com sucesso!',
    'echo O computador agora sincronizara regras e bloqueara sites via hosts automaticamente.',
    `echo Apenas o utilizador "${monitoredUser}" sera monitorizado e restringido.`,
    'echo.',
    'echo Concluido! Pode fechar esta janela.',
    'pause'
  ];

  res.setHeader('Content-Type', 'application/x-bat');
  res.setHeader('Content-Disposition', 'attachment; filename="install-winguard.bat"');
  res.send(lines.join('\r\n'));
});

// Raw Hosts snippet download
downloadsRouter.get('/hosts-snippet/:deviceId', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const snippet = db.generateHostsBlockSnippet(deviceId);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="winguard-hosts-${deviceId}.txt"`);
  res.send(snippet);
});
