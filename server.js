require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./leads.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      phone TEXT,
      email TEXT,
      company TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.COMPANY_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post('/api/send-query', async (req, res) => {
  const { firstName, phone, email, company, message } = req.body;

  // Insert Lead into SQLite
  db.run(
    `INSERT INTO leads (firstName, phone, email, company, message) VALUES (?, ?, ?, ?, ?)`,
    [firstName, phone, email, company, message],
    function (err) {
      if (err) {
        console.error('Error saving lead to database:', err.message);
        
        // Backup to CSV if DB fails
        const backupFile = 'backup_leads.csv';
        const csvRecord = `"${(firstName || '').replace(/"/g, '""')}","${(phone || '').replace(/"/g, '""')}","${(email || '').replace(/"/g, '""')}","${(company || '').replace(/"/g, '""')}","${(message || '').replace(/"/g, '""')}","${new Date().toISOString()}"\n`;
        
        fs.appendFile(backupFile, csvRecord, (fsErr) => {
          if (fsErr) console.error('Error writing to backup_leads.csv:', fsErr);
          else console.log('Lead backed up to backup_leads.csv due to DB error.');
        });
      }
    }
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // 1. Send the lead to your company email in the background (FOLLOWING YOUR SCREENSHOT FORMAT)
  transporter.sendMail({
    from: `"Ornate Website" <${process.env.COMPANY_EMAIL}>`,
    to: process.env.COMPANY_EMAIL,
    replyTo: email,
    subject: `🤘 New UnityESS Web Lead from ${company || 'Individual User'}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #333 text-decoration: none;">
        <p>This is an automated web lead</p>
        <p><strong>Lead Name :</strong> ${firstName}</p>
        <p><strong>Lead Email :</strong> ${email}</p>
        <p><strong>Lead Phone :</strong> ${phone}</p>
        <p><strong>Lead requirement :</strong> ${message || 'No requirement mentioned'}</p>
        <p><strong>Lead Organization :</strong> ${company || 'Individual'}</p>
        <p><strong>Brand page :</strong> <a href="https://ornatesolar.com/unity-ess">https://ornatesolar.com/unity-ess</a></p>
        <p><strong>Time :</strong> ${timeStr}</p>
        <p><strong>Date :</strong> ${dateStr}</p>
      </div>
    `,
  }).catch(error => console.error("Error sending lead email:", error));

  // 2. Send the automated response to the customer in the background
  transporter.sendMail({
    from: `"Ornate Solar" <${process.env.COMPANY_EMAIL}>`,
    to: email,
    subject: `Thank you for reaching out to Ornate Solar`,
    attachments: [
      {
        filename: 'Bess-Datasheet.pdf',
        path: './attachments/Bess -Datasheet.pdf'
      }
    ],
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <p>Dear <strong>${firstName}</strong>,</p>

        <p>Thank you for reaching out to us.</p>

        <p>We have received your query about Unity ESS, our Made-in-India Energy Storage System designed and manufactured by Ornate Solar. Our technical expert will reach out to you soon to understand your requirements and discuss the most suitable energy storage configuration for your project.</p>
        <p>Please find attached the datasheet for Unity ESS.</p>

        <h3 style="color: #3A5881; margin-top: 25px;">Unity ESS</h3>
        <p>We built Unity ESS to be a reliable, scalable, and intelligent energy storage solution that empowers businesses, industries, and utilities to take control of their power.</p>
        <p>Engineered and manufactured in India, Unity ESS integrates advanced lithium-ion battery packs, a smart Battery Management System (BMS), Power Conversion System (PCS), intelligent cooling, and fire safety mechanisms &mdash; all within a modular architecture that ensures flexibility and efficiency across multiple applications.</p>

        <p><strong>Unity ESS is available in three configurations:</strong></p>
        <ul style="padding-left: 20px;">
          <li><strong>Model A:</strong> Compact outdoor cabinet ideal for commercial and industrial (C&I) setups.</li>
          <li><strong>Model B:</strong> DC-coupled modular system for solar + storage integration, perfect for peak-shaving and load-shifting.</li>
          <li><strong>Model C:</strong> Containerized utility-scale energy storage unit for grid support and large-scale renewable integration.</li>
        </ul>

        <p>Built for Indian conditions, Unity ESS delivers high performance, long life (10,000+ cycles), and rapid deployment capability, ensuring uninterrupted power and maximum solar utilization.</p>
        <p>Unity ESS supports applications like peak-load management, backup power, renewable energy optimization, and microgrids &mdash; enabling true energy independence and resilience.</p>

        <h3 style="color: #3A5881; margin-top: 25px;">About Ornate Solar</h3>
        <ul style="padding-left: 20px;">
          <li><strong>Unity ESS</strong> &mdash; Advanced storage for reliable backup & peak load management</li>
          <li><strong>First Solar Panels</strong> &mdash; Thin Film Solar Module: 525-550 Wp</li>
          <li><strong>RenewSys Solar Panels</strong> &mdash; TopCon Bifacial: 585- 635Wp</li>
          <li><strong>SolarEdge Inverters with Optimizers</strong> &mdash; (3kW-100kW)</li>
          <li><strong>Enphase Microinverter</strong> (IQ8HC & IQ8P) and IQ Battery 5P</li>
          <li><strong>Hopewind Inverters</strong> &mdash; 385kW (highest capacity string inverter)</li>
          <li><strong>Ornate Inroof</strong> &mdash; Makes solar panels your primary roof eliminating the need for metal/sheet roofing</li>
          <li><strong>Umang Battery-less Solar Inverter</strong> &mdash; 3kW, 5kW & 8kW</li>
        </ul>

        <p>With over 26 warehouses across India and a dedicated service network, we ensure fast, secure delivery of your solar products.</p>
        <p>We look forward to the opportunity to work with you and help you take a significant step toward a sustainable and energy-efficient future.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 13px;">
          &#128222; +91 18002026252<br/>
          &#127103; <a href="https://ornatesolar.com/unity-ess" style="color: #3A5881;">https://ornatesolar.com/unity-ess</a><br/>
          &#127970; A-87, Okhla Industrial Area, Phase 2, Delhi &ndash; 110020<br/>
          <em>Offices: Mumbai | Delhi | Gurgaon | Faridabad | Ahmedabad</em>
        </p>
      </div>
    `,
  }).catch(error => console.error("Error sending response email:", error));

  // Instantly return success to the website while emails process in the background (0ms!)
  res.status(200).json({ success: true, message: "Query received!" });
});

app.get('/dashboard', (req, res) => {
  db.all(`SELECT * FROM leads ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).send("Error reading leads.");
      return;
    }

    let tableRows = rows.map(row => `
      <tr class="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group">
        <td class="px-4 py-2.5 text-[13px] text-slate-500 font-medium">${row.id}</td>
        <td class="px-4 py-2.5 text-[13px] font-semibold text-slate-900">${row.firstName}</td>
        <td class="px-4 py-2.5 text-[13px] text-slate-600">${row.email}</td>
        <td class="px-4 py-2.5 text-[13px] text-slate-600">${row.phone}</td>
        <td class="px-4 py-2.5 text-[13px] text-slate-600 truncate max-w-[120px]" title="${row.company ? row.company.replace(/"/g, '&quot;') : ''}">${row.company || '-'}</td>
        <td class="px-4 py-2.5 text-[13px] text-slate-600 truncate max-w-[200px]" title="${row.message ? row.message.replace(/"/g, '&quot;') : ''}">${row.message || '-'}</td>
        <td class="px-4 py-2.5 text-[12px] text-slate-500 whitespace-nowrap">${new Date(row.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unityess</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            body { font-family: 'Inter', sans-serif; }
            ::-webkit-scrollbar { height: 6px; width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          </style>
      </head>
      <body class="bg-slate-50 p-4 sm:p-6 min-h-screen">
          <div class="max-w-[90rem] mx-auto space-y-4">
              <!-- Header -->
              <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 class="text-lg font-semibold text-slate-900 tracking-tight">UnityESS Leads Overview</h1>
                  <p class="text-[13px] text-slate-500 mt-0.5">Manage and export incoming customer requests.</p>
                </div>
                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <span class="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-indigo-100/50 whitespace-nowrap">
                    ${rows.length} Total leads
                  </span>
                  <a href="/dashboard/export" class="flex-1 sm:flex-none text-center bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium py-1.5 px-3 rounded-md shadow-sm transition-colors flex items-center justify-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export CSV
                  </a>
                </div>
              </div>

              <!-- Table -->
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr class="bg-slate-50/80 border-b border-slate-200">
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                                <th class="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date Submitted</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            ${tableRows.length > 0 ? tableRows : '<tr><td colspan="7" class="px-4 py-8 text-center text-[13px] text-slate-400">No data available.</td></tr>'}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
      </body>
      </html>
    `;
    res.send(html);
  });
});

app.get('/dashboard/export', (req, res) => {
  db.all(`SELECT * FROM leads ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).send("Error reading leads for export.");
      return;
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Company', 'Message', 'Date'];
    const csvRows = rows.map(row => {
      return [
        row.id,
        `"${row.firstName ? row.firstName.replace(/"/g, '""') : ''}"`,
        `"${row.phone ? row.phone.replace(/"/g, '""') : ''}"`,
        `"${row.email ? row.email.replace(/"/g, '""') : ''}"`,
        `"${row.company ? row.company.replace(/"/g, '""') : ''}"`,
        `"${row.message ? row.message.replace(/"/g, '""') : ''}"`,
        `"${new Date(row.created_at).toLocaleString()}"`
      ].join(',');
    });

    const csvData = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="unityess_leads.csv"');
    res.send(csvData);
  });
});

const networkInterfaces = os.networkInterfaces();
let ipAddress = 'localhost';
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (let i = 0; i < interfaces.length; i++) {
    if (interfaces[i].family === 'IPv4' && !interfaces[i].internal) {
      ipAddress = interfaces[i].address;
      break;
    }
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend is securely running for external devices!`);
  console.log(`- Local PC Access: http://localhost:${PORT}`);
  console.log(`- Network / Mobile Access: http://${ipAddress}:${PORT}`);
});
