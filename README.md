
# PiperLing Web App

![Piperling Logo](https://aestheticdreams.ai/images/piperling_logo.png)

The PiperLing Web App allows you to use PiperLing on various devices, including smartphones. The app provides an intuitive user interface for real-time speech translation and synthesis.

## Installation

### Prerequisites
- A web server
- Port 5000 open for PiperLing's API Endpoint
- Subdomain pointing to the PiperLing API Endpoint (HTTPS required)
- PiperLing version v0.0.2-alpha or higher

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/PiperLingWebApp.git
   cd PiperLingWebApp
   ```

2. **Open Port 5000**
   - Ensure that port 5000 is open for the PiperLing API Endpoint.

3. **Set Up Subdomain**
   - Create a subdomain and point it to the PiperLing API Endpoint on port 5000.

4. **Upload Files**
   - Upload all files and directories from the `PiperLingWebApp` folder to a subdirectory on your web server.

5. **Configure API Endpoint**
   - Go to your website, change the API Endpoint in the settings to `https://subdomain.YourPiperLingEndpoint.com/` and save the changes.

## Preview

![Piperling App Preview](https://www.piperling.com/preview.png)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
