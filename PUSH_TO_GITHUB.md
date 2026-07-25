# Pushing CrickElite to GitHub

Since Git is not recognized in your terminal yet, follow this step-by-step guide to install Git and push the project.

---

### **Step 1: Install Git (If not installed)**
1. Download **Git for Windows** from: [https://git-scm.com/download/win](https://git-scm.com/download/win).
2. Run the installer and choose all the default recommended options.
3. Once the installation is finished, **close and reopen your terminal or code editor** (like VS Code) so it updates your system path.

---

### **Step 2: Configure Git with your Details**
Open a new terminal (in VS Code, press `Ctrl + ~`), and run these commands with your info:
```bash
git config --global user.name "PranshBarasara"
git config --global user.email "your-email@example.com"
```

---

### **Step 3: Initialize and Push Your Project**
Navigate to your project root `d:\Pranscric` in the terminal and run these commands one by one:

1. **Initialize a Git repository:**
   ```bash
   git init
   ```

2. **Stage all files:**
   ```bash
   git add .
   ```

3. **Commit the project files:**
   ```bash
   git commit -m "feat: Initialize CrickElite premium tournament organizer and real-time live scorer"
   ```

4. **Point to your GitHub repository:**
   ```bash
   git remote add origin https://github.com/PranshBarasara/CrickElite.git
   ```

5. **Rename branch to main:**
   ```bash
   git branch -M main
   ```

6. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

*(Note: During the push command, a window will pop up asking you to log in to your GitHub account to authorize the upload.)*
