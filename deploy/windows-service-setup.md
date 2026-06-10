# Running LuxEngine as a Windows Service

To run LuxEngine continuously in the background on Windows boot without keeping a terminal open, you can configure it as a Windows Service using **NSSM (Non-Sucking Service Manager)**.

---

## 1. Prerequisites

1. Download the latest version of NSSM from [nssm.cc/download](https://nssm.cc/download).
2. Extract `nssm.exe` (specifically from the `win64/` directory) to an accessible folder (e.g., `C:\Program Files\nssm\nssm.exe`).
3. Ensure your Python environment is set up and working at `D:\LuxEngine` (using your local virtual environment).

---

## 2. Installing the Service

Open **PowerShell as Administrator** and execute:

```powershell
# Install the service via the NSSM GUI
& "C:\Program Files\nssm\nssm.exe" install LuxEngine
```

A GUI installer window will open. Configure the following fields:

### Application Tab
- **Path:** `C:\Users\Marcp\AppData\Local\Python\pythoncore-3.14-64\Scripts\free-claude-code.exe` *(or path to your virtual environment's executable)*
- **Startup directory:** `D:\LuxEngine`
- **Arguments:** *(Leave blank)*

### Environment Tab
If you want to pass environment variables directly through the service (instead of `.env` files), you can set them here:
```text
ANTHROPIC_AUTH_TOKEN=freecc
PORT=8082
HOST=0.0.0.0
```

Click **Install service**.

---

## 3. Managing the Service

Once installed, you can control the service using standard PowerShell or the Windows Service Console (`services.msc`):

```powershell
# Start the service
Start-Service LuxEngine

# Stop the service
Stop-Service LuxEngine

# Restart the service
Restart-Service LuxEngine

# Check current status
Get-Service LuxEngine
```

---

## 4. Troubleshooting & Logs

To capture stdout and stderr logs for troubleshooting, run `nssm edit LuxEngine`, navigate to the **I/O** tab, and configure output paths:
- **Output (stdout):** `D:\LuxEngine\nssm_out.log`
- **Error (stderr):** `D:\LuxEngine\nssm_err.log`
