window.Reports = {
  reportType: 'daily', // daily, monthly, annual
  selectedDate: '',
  settings: {},

  getLocalDateStr(d = new Date()) {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async render(container) {
    this.settings = await window.api.getSettings();
    
    container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
            <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
          </div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight">Financial Reports</h2>
        </div>

        <div class="mb-8">
          <!-- Report Selection Card -->
          <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i data-lucide="settings-2" class="w-5 h-5 text-accent"></i>
              Report Configuration
            </h3>

            <div class="space-y-8">
              <!-- Type Selection -->
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Report Type</label>
                <div class="grid grid-cols-3 gap-3">
                  <button onclick="Reports.setType('daily')" id="type-daily" class="report-type-btn flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group active-accent bg-accent border-accent text-slate-900 font-bold">
                    <i data-lucide="calendar-days" class="w-6 h-6"></i>
                    <span>Daily Report</span>
                  </button>
                  <button onclick="Reports.setType('monthly')" id="type-monthly" class="report-type-btn flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 transition-all group font-bold">
                    <i data-lucide="calendar-range" class="w-6 h-6"></i>
                    <span>Monthly Report</span>
                  </button>
                  <button onclick="Reports.setType('annual')" id="type-annual" class="report-type-btn flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 transition-all group font-bold">
                    <i data-lucide="calendar" class="w-6 h-6"></i>
                    <span>Annual Report</span>
                  </button>
                </div>
              </div>

              <!-- Date Picker -->
              <div id="date-picker-container">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4" id="picker-label">Select Day</label>
                <div class="relative max-w-sm">
                  <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                  <input type="date" id="report-date-input" 
                    value="${this.selectedDate}" 
                    onchange="Reports.updateSelectedDate(this.value)"
                    class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-lg font-black text-slate-700 focus:bg-white focus:border-accent outline-none transition-all">
                </div>
              </div>

              <div class="pt-4 border-t border-slate-50">
                <button onclick="Reports.generate()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group">
                  <i data-lucide="printer" class="w-6 h-6 text-accent group-hover:scale-110 transition-transform"></i>
                  GENERATE & PRINT REPORT
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Area (Hidden normally, shown as preview if desired, but user asked for auto-print) -->
        <div id="report-preview" class="hidden bg-white p-8 rounded-3xl border border-dashed border-slate-300 items-center justify-center text-slate-400">
           <!-- Preview content -->
        </div>
      </div>

      <!-- Local style and container removed -->
    `;

    if (window.lucide) lucide.createIcons();
    this.setType('daily');
  },

  setType(type) {
    this.reportType = type;
    
    // Update UI
    document.querySelectorAll('.report-type-btn').forEach(btn => {
      btn.classList.remove('bg-accent', 'border-accent', 'text-slate-900');
      btn.classList.add('border-slate-100', 'bg-slate-50', 'text-slate-500');
    });

    const activeBtn = document.getElementById(`type-${type}`);
    activeBtn.classList.add('bg-accent', 'border-accent', 'text-slate-900');
    activeBtn.classList.remove('border-slate-100', 'bg-slate-50', 'text-slate-500');

    const input = document.getElementById('report-date-input');
    const label = document.getElementById('picker-label');
    
    if (type === 'daily') {
      input.type = 'date';
      label.textContent = 'Select Day';
      input.value = this.getLocalDateStr();
      this.selectedDate = input.value;
    } else if (type === 'monthly') {
      input.type = 'month';
      label.textContent = 'Select Month';
      const now = new Date();
      input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.selectedDate = input.value;
    } else if (type === 'annual') {
      label.textContent = 'Select Year';
      input.type = 'number';
      input.min = '2000';
      input.max = '2100';
      input.value = new Date().getFullYear();
      this.selectedDate = input.value;
    }
  },

  updateSelectedDate(val) {
    this.selectedDate = val;
  },

  async generate() {
    app.showLoading();
    
    let filters = {};
    let periodLabel = '';
    
    const inputVal = document.getElementById('report-date-input').value;
    
    if (this.reportType === 'daily') {
      filters = { start: inputVal, end: inputVal };
      periodLabel = app.formatDate(inputVal);
    } else if (this.reportType === 'monthly') {
      const [year, month] = inputVal.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      filters = { 
        start: `${year}-${String(month).padStart(2, '0')}-01`, 
        end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` 
      };
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      periodLabel = `${monthNames[month - 1]} ${year}`;
    } else if (this.reportType === 'annual') {
      const year = inputVal;
      filters = { 
        start: `${year}-01-01`, 
        end: `${year}-12-31` 
      };
      periodLabel = `Year ${year}`;
    }

    const data = await window.api.getReportSummary(filters);
    
    const margin = data.sales.amount > 0 ? (data.sales.profit / data.sales.amount * 100).toFixed(2) : '0.00';
    const netProfit = data.sales.profit - data.expenses.amount;

    const printContainer = document.getElementById('report-print-container');
    const html = `
        <div class="receipt-80mm" style="width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 6px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace, sans-serif; color: #000; box-sizing: border-box; font-size: 11px; line-height: 1.35; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 4px;">
                <h1 style="font-size: 16px; font-weight: 900; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${this.settings.company_name || 'ISHAQ JADOON TRADERS'}</h1>
                <div style="font-size: 11px; font-weight: 600; color: #000; line-height: 1.25; margin-bottom: 2px;">${this.settings.address || 'Near CB Plaza, Barrier 3, Main GT Road, Wah Cantt'}</div>
                <div style="font-size: 11px; font-weight: 700; color: #000; line-height: 1.3;">
                    <div>M.Ishaq: 0301-2630481</div>
                    <div>Ch. Shakir: 0300-5074410</div>
                </div>
                <div style="margin-top: 5px;">
                    <span style="display: inline-block; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 10px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px;">FINANCIAL REPORT &bull; ${this.reportType.toUpperCase()}</span>
                </div>
            </div>
            
            <!-- Metadata -->
            <div style="font-size: 11px; line-height: 1.35; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px dashed #000;">
                <div style="display: flex; justify-content: space-between;">
                    <span><b>Period:</b> ${periodLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 1px;">
                    <span><b>Date:</b> ${app.formatDateTime(new Date().toISOString())}</span>
                </div>
            </div>

            <!-- Sales Summary Section -->
            <div style="margin-bottom: 4px;">
                <div style="font-weight: 900; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px; margin-bottom: 2px; border-bottom: 1px solid #000; padding-bottom: 1px;">SALES SUMMARY</div>
                <table style="width: 100%; font-size: 11px; border-collapse: collapse; line-height: 1.45;">
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Invoices:</td><td style="text-align: right; font-weight: 600; padding: 2px 0;">${data.sales.count}</td></tr>
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Items Sold:</td><td style="text-align: right; font-weight: 600; padding: 2px 0;">${data.sales.itemsSold}</td></tr>
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Sell Amount:</td><td style="text-align: right; font-weight: 700; padding: 2px 0;">${app.formatCurrency(data.sales.amount)}</td></tr>
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Inventory Cost:</td><td style="text-align: right; font-weight: 600; padding: 2px 0;">${app.formatCurrency(data.sales.cost)}</td></tr>
                    <tr style="border-top: 1px dashed #000; border-bottom: 1px dashed #000;"><td style="padding: 2px 0; font-weight: 800;">Gross Profit:</td><td style="text-align: right; font-weight: 800; padding: 2px 0;">${app.formatCurrency(data.sales.profit)} (${margin}%)</td></tr>
                </table>
            </div>

            <!-- Expenses Summary Section -->
            <div style="margin-bottom: 4px; border-top: 1px dashed #000; padding-top: 3px;">
                <div style="font-weight: 900; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px; margin-bottom: 2px; border-bottom: 1px solid #000; padding-bottom: 1px;">EXPENSES & PURCHASES</div>
                <table style="width: 100%; font-size: 11px; border-collapse: collapse; line-height: 1.45;">
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Expenses:</td><td style="text-align: right; font-weight: 700; padding: 2px 0;">${app.formatCurrency(data.expenses.amount)}</td></tr>
                    <tr><td style="padding: 2px 0;">Transactions Count:</td><td style="text-align: right; font-weight: 600; padding: 2px 0;">${data.expenses.count}</td></tr>
                </table>
            </div>

            <!-- Supplier Balances Section -->
            <div style="margin-bottom: 4px; border-top: 1px dashed #000; padding-top: 3px;">
                <div style="font-weight: 900; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px; margin-bottom: 2px; border-bottom: 1px solid #000; padding-bottom: 1px;">SUPPLIER BALANCES</div>
                <table style="width: 100%; font-size: 11px; border-collapse: collapse; line-height: 1.45;">
                    <tr style="border-bottom: 1px dashed #f1f5f9;"><td style="padding: 2px 0;">Total Accounts Payable:</td><td style="text-align: right; font-weight: 700; padding: 2px 0;">${app.formatCurrency(data.vendors.amount)}</td></tr>
                    <tr><td style="padding: 2px 0;">Active Suppliers:</td><td style="text-align: right; font-weight: 600; padding: 2px 0;">${data.vendors.count}</td></tr>
                </table>
            </div>

            <!-- Net Summary Box -->
            <div style="margin-top: 4px; border-top: 1.5px solid #000; padding-top: 4px; font-size: 11.5px; line-height: 1.5;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Gross Profit:</span>
                    <span style="font-weight: 700;">${app.formatCurrency(data.sales.profit)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Operating Expenses:</span>
                    <span style="font-weight: 700;">(${app.formatCurrency(data.expenses.amount)})</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0; margin-top: 3px; font-size: 13.5px; font-weight: 900;">
                    <span>NET ${netProfit >= 0 ? 'PROFIT' : 'LOSS'}:</span>
                    <span>${netProfit < 0 ? '(' : ''}${app.formatCurrency(Math.abs(netProfit))}${netProfit < 0 ? ')' : ''}</span>
                </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 6px; border-top: 1px dashed #000; padding-top: 4px; text-align: center; font-size: 10px;">
                <p style="margin: 0; font-weight: 700; text-transform: uppercase;">*** END OF FINANCIAL REPORT ***</p>
            </div>
        </div>
    `;

    app.setPrintContent('report-print-container', html);

    // Show Preview
    const previewEl = document.getElementById('preview-paper');
    if (previewEl) previewEl.innerHTML = html;
    
    document.getElementById('preview-title').textContent = 'Financial Report Preview';
    document.getElementById('preview-subtitle').textContent = `80MM THERMAL RECEIPT • ${this.reportType.toUpperCase()}`;
    
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();

    app.hideLoading();
  }
};
