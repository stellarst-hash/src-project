const rows=document.getElementById('rows');
const sl=document.getElementById('sl');
const version=document.getElementById('version');
const lot=document.getElementById('lot');
const initialBalance=document.getElementById('initial-balance');
const baseRisk=document.getElementById('base-risk');
const rr=document.getElementById('rr');
const versionLabel=document.getElementById('version-label');
const versionInfo=document.getElementById('version-info');
const versionTooltip=document.getElementById('version-tooltip');
const settingsButton=document.getElementById('settings');
const duplicateVersionButton=document.getElementById('duplicate-version');
const tableEditActions=document.getElementById('table-edit-actions');
const addRowButton=document.getElementById('add-row');
const deleteRowButton=document.getElementById('delete-row');
const minus=document.getElementById('minus');
const tableFontSize=document.getElementById('table-font-size');
const tableFontSizeValue=document.getElementById('table-font-size-value');
const rowHeight=document.getElementById('row-height');
const rowHeightValue=document.getElementById('row-height-value');

const BASE_LOT=0.01;
const BASE_SL_PIPS=40;
const BASE_LOSS=4;
const TABLE_FONT_SIZE_STORAGE_KEY='risk-calculator-table-font-size';
const ROW_HEIGHT_STORAGE_KEY='risk-calculator-row-height';
const VERSION_SETTINGS_STORAGE_KEY='risk-calculator-version-settings';
const CUSTOM_VERSIONS_STORAGE_KEY='risk-calculator-custom-versions';

const versions={
  Accelerate:{
    initialBalance:50000,
    baseRisk:1000,
    riskReward:3,
    label:'Adaptive Recovery',
    description:'Designed to maximize growth through higher exposure and a 1:3 return ratio.',
    tooltip:'Designed to maximize growth through higher exposure and a 1:3 return ratio.',
    risks:[1000,500,750,1125,1688,2532,3798,5697,8545,12818]
  },
  Stability:{
    initialBalance:50000,
    baseRisk:400,
    riskReward:2,
    label:'Controlled Recovery',
    description:'Designed to prioritize capital protection through lower exposure and a 1:2 return ratio.',
    tooltip:`<p>Designed to prioritize capital protection through lower exposure and a 1:2 return ratio.</p><ol><li>Trade 1: 1×</li><li>Trade 2–5: <strong>2× Profit Recovery</strong></li><li>Trade 6+: <strong>1× Pure Recovery</strong></li><li>WIN → <strong>Recovery + Profit → Reset</strong></li></ol>`,
    risks:[400,400,800,1600,3200,3200,4800,7200,10800,16200]
  }
};

const SETTINGS_ICON=`<svg class="settings-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1a7.2 7.2 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.38 2.65c-.61.25-1.18.58-1.69.98l-2.49-1c-.23-.09-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.05.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.51.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.48 0 .6-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>`;
const SAVE_ICON=`<svg class="settings-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
let isEditingSettings=false;
const customVersionNames=new Set();

const formatCurrency=value=>`$${value.toLocaleString('en-US')}`;
const slPips=()=>Math.max(1,Number(sl.value)||BASE_SL_PIPS);
const calcLot=risk=>BASE_LOT*(risk/BASE_LOSS)*(BASE_SL_PIPS/slPips());
const formatLot=value=>value.toFixed(2);
const parsePositiveNumber=value=>Number(String(value).replace(/[$,\s]/g,''));

function addVersionOption(name){
  if([...version.options].some(option=>option.value===name))return;
  const option=document.createElement('option');
  option.value=name;
  option.textContent=name;
  version.append(option);
}

function persistCustomVersions(){
  const customVersions=[...customVersionNames].map(name=>({name,config:versions[name]}));
  try{
    localStorage.setItem(CUSTOM_VERSIONS_STORAGE_KEY,JSON.stringify(customVersions));
  }catch(error){}
}

function restoreCustomVersions(){
  try{
    const customVersions=JSON.parse(localStorage.getItem(CUSTOM_VERSIONS_STORAGE_KEY));
    if(!Array.isArray(customVersions))return;
    customVersions.forEach(({name,config})=>{
      const versionName=typeof name==='string'?name.trim():'';
      const risks=Array.isArray(config?.risks)?config.risks.map(parsePositiveNumber):[];
      if(!versionName||versions[versionName]||risks.length===0||risks.some(risk=>!Number.isFinite(risk)||risk<=0))return;
      const initialBalanceValue=parsePositiveNumber(config.initialBalance);
      const baseRiskValue=parsePositiveNumber(config.baseRisk);
      const riskRewardValue=parsePositiveNumber(config.riskReward);
      if(!Number.isFinite(initialBalanceValue)||initialBalanceValue<=0
        ||!Number.isFinite(baseRiskValue)||baseRiskValue<=0
        ||!Number.isFinite(riskRewardValue)||riskRewardValue<=0)return;
      versions[versionName]={
        initialBalance:initialBalanceValue,
        baseRisk:baseRiskValue,
        riskReward:riskRewardValue,
        label:versionName,
        description:typeof config.description==='string'?config.description:`Custom version: ${versionName}.`,
        tooltip:typeof config.tooltip==='string'?config.tooltip:`Custom version: ${versionName}.`,
        risks
      };
      customVersionNames.add(versionName);
      addVersionOption(versionName);
    });
  }catch(error){}
}

function duplicateCurrentVersion(){
  const newName=window.prompt('Masukkan nama untuk versi baru:');
  if(newName===null)return;
  const versionName=newName.trim();
  if(!versionName){
    window.alert('Nama versi tidak boleh kosong.');
    return;
  }
  if(versions[versionName]){
    window.alert('Versi dengan nama tersebut sudah ada.');
    return;
  }

  const source=versions[version.value];
  versions[versionName]={
    ...source,
    label:versionName,
    description:`Custom version duplicated from ${version.value}.`,
    tooltip:`Custom version duplicated from ${version.value}.`,
    risks:[...source.risks]
  };
  customVersionNames.add(versionName);
  addVersionOption(versionName);
  persistCustomVersions();
  persistVersionSettings();
  setSettingsEditing(false);
  version.value=versionName;
  renderVersion();
}

function restoreVersionSettings(){
  try{
    const savedSettings=JSON.parse(localStorage.getItem(VERSION_SETTINGS_STORAGE_KEY));
    Object.entries(savedSettings||{}).forEach(([name,saved])=>{
      const config=versions[name];
      if(!config)return;
      const initialBalanceValue=parsePositiveNumber(saved.initialBalance);
      const baseRiskValue=parsePositiveNumber(saved.baseRisk);
      const riskRewardValue=parsePositiveNumber(saved.riskReward);
      if(Number.isFinite(initialBalanceValue)&&initialBalanceValue>0)config.initialBalance=initialBalanceValue;
      if(Number.isFinite(baseRiskValue)&&baseRiskValue>0)config.baseRisk=baseRiskValue;
      if(Number.isFinite(riskRewardValue)&&riskRewardValue>0)config.riskReward=riskRewardValue;
      if(Array.isArray(saved.risks)
        &&saved.risks.length>0
        &&saved.risks.every(risk=>Number.isFinite(parsePositiveNumber(risk))&&parsePositiveNumber(risk)>0)){
        config.risks=saved.risks.map(parsePositiveNumber);
      }
    });
  }catch(error){}
}

function persistVersionSettings(){
  const settings=Object.fromEntries(Object.entries(versions).map(([name,config])=>[
    name,
    {
      initialBalance:config.initialBalance,
      baseRisk:config.baseRisk,
      riskReward:config.riskReward,
      risks:config.risks
    }
  ]));
  try{
    localStorage.setItem(VERSION_SETTINGS_STORAGE_KEY,JSON.stringify(settings));
  }catch(error){}
}

function showVersionValues(config){
  if(isEditingSettings){
    initialBalance.value=config.initialBalance;
    baseRisk.value=config.baseRisk;
    rr.value=config.riskReward;
    return;
  }
  initialBalance.value=formatCurrency(config.initialBalance);
  baseRisk.value=formatCurrency(config.baseRisk);
  rr.value=`1 : ${config.riskReward}`;
}

function setSettingsEditing(editing){
  isEditingSettings=editing;
  [initialBalance,baseRisk,rr].forEach(input=>{input.disabled=!editing;});
  duplicateVersionButton.disabled=editing;
  tableEditActions.hidden=!editing;
  settingsButton.classList.toggle('is-saving',editing);
  settingsButton.setAttribute('aria-label',editing?'Save version settings':'Edit version settings');
  settingsButton.innerHTML=editing?SAVE_ICON:SETTINGS_ICON;
}

function startEditingSettings(){
  const config=versions[version.value];
  if(!config)return;
  setSettingsEditing(true);
  renderVersion();
  initialBalance.focus();
}

function saveSettings(){
  const values=[initialBalance,baseRisk,rr].map(input=>parsePositiveNumber(input.value));
  const invalidIndex=values.findIndex(value=>!Number.isFinite(value)||value<=0);
  if(invalidIndex!==-1){
    const invalidInput=[initialBalance,baseRisk,rr][invalidIndex];
    invalidInput.setCustomValidity('Enter a number greater than zero.');
    invalidInput.reportValidity();
    invalidInput.focus();
    return;
  }

  const riskInputs=[...rows.querySelectorAll('.table-risk-input')];
  const riskValues=riskInputs.map(input=>parsePositiveNumber(input.value));
  const invalidRiskIndex=riskValues.findIndex(value=>!Number.isFinite(value)||value<=0);
  if(invalidRiskIndex!==-1){
    const invalidInput=riskInputs[invalidRiskIndex];
    invalidInput.setCustomValidity('Enter a number greater than zero.');
    invalidInput.reportValidity();
    invalidInput.focus();
    return;
  }

  const config=versions[version.value];
  config.initialBalance=values[0];
  config.baseRisk=values[1];
  config.riskReward=values[2];
  config.risks=riskValues;
  persistVersionSettings();
  persistCustomVersions();
  setSettingsEditing(false);
  renderVersion();
  setLotValue('Zero');
}

[initialBalance,baseRisk,rr].forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));

function setLotValue(value){
  const isZero=value==='Zero';
  lot.textContent=value;
  lot.classList.toggle('is-disabled',isZero);
  lot.setAttribute('aria-disabled',String(isZero));
}

function updateMinusState(){
  minus.disabled=slPips()<=10;
}

function updateRowHeight(save=false){
  const height=Number(rowHeight.value);
  const buttonHeight=Math.round(28+((height-42)*20/19));
  document.documentElement.style.setProperty('--table-row-height',`${height}px`);
  document.documentElement.style.setProperty('--action-button-height',`${buttonHeight}px`);
  updateSliderProgress(rowHeight);
  rowHeightValue.textContent=`${height}px`;
  if(save){
    try{
      localStorage.setItem(ROW_HEIGHT_STORAGE_KEY,String(height));
    }catch(error){}
  }
}

function updateTableFontSize(save=false){
  const fontSize=Number(tableFontSize.value);
  document.documentElement.style.setProperty('--table-font-size',`${fontSize}px`);
  updateSliderProgress(tableFontSize);
  tableFontSizeValue.textContent=`${fontSize}px`;
  if(save){
    try{
      localStorage.setItem(TABLE_FONT_SIZE_STORAGE_KEY,String(fontSize));
    }catch(error){}
  }
}

function updateSliderProgress(slider){
  const progress=((Number(slider.value)-Number(slider.min))
    /(Number(slider.max)-Number(slider.min)))*100;
  slider.style.setProperty('--slider-progress',`${progress}%`);
}

function restoreSliderValue(slider,storageKey){
  try{
    const savedValue=Number(localStorage.getItem(storageKey));
    if(savedValue>=Number(slider.min)&&savedValue<=Number(slider.max)){
      slider.value=savedValue;
    }
  }catch(error){}
}

const WIN_ICON=`<svg viewBox="0 0 32 32"><path d="M3 25l8-9 5 4 9-12"/><path d="M20 8h5v5"/></svg>`;

function bindRiskInput(input){
  input.addEventListener('input',()=>{
    input.setCustomValidity('');
    const risk=parsePositiveNumber(input.value);
    const profitCell=input.closest('tr').cells[2];
    profitCell.textContent=Number.isFinite(risk)&&risk>0
      ? formatCurrency(risk*versions[version.value].riskReward)
      : '—';
  });
}

function updateRowControls(){
  deleteRowButton.disabled=rows.children.length<=1;
}

function addRiskRow(){
  if(!isEditingSettings)return;
  const index=rows.children.length+1;
  const row=document.createElement('tr');
  row.className='row-disabled';
  row.innerHTML=`
    <td>${index}</td>
    <td><input class="table-risk-input" type="text" inputmode="decimal" autocomplete="off" aria-label="Risk for trade ${index}"></td>
    <td>—</td>
    <td class="action-cell"><div class="action-buttons"><button class="action-btn win" type="button" aria-label="Lot size unavailable" disabled>${WIN_ICON}</button></div></td>`;
  rows.append(row);
  const riskInput=row.querySelector('.table-risk-input');
  bindRiskInput(riskInput);
  updateRowControls();
  riskInput.focus();
}

function deleteLastRiskRow(){
  if(!isEditingSettings||rows.children.length<=1)return;
  rows.lastElementChild.remove();
  updateRowControls();
}

function renderVersion(){
  const config=versions[version.value];
  if(!config)return;

  showVersionValues(config);
  versionLabel.textContent=config.label;
  versionInfo.setAttribute('aria-label',config.description);
  versionTooltip.innerHTML=config.tooltip;
  rows.innerHTML=config.risks.map((risk,index)=>{
    const lotSize=formatLot(calcLot(risk));
    const riskValue=isEditingSettings
      ? `<input class="table-risk-input" type="text" inputmode="decimal" autocomplete="off" value="${risk}" aria-label="Risk for trade ${index+1}">`
      : formatCurrency(risk);
    return `<tr class="row-disabled">
      <td>${index+1}</td>
      <td>${riskValue}</td>
      <td>${formatCurrency(risk*config.riskReward)}</td>
      <td class="action-cell">
        <div class="action-buttons">
          <button class="action-btn win" type="button" data-risk="${risk}" aria-label="Lot size ${lotSize}" aria-pressed="false"${isEditingSettings?' disabled':''}>${WIN_ICON}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if(isEditingSettings){
    rows.querySelectorAll('.table-risk-input').forEach(bindRiskInput);
    updateRowControls();
  }
  setLotValue('Zero');
}

function resetTable(){
  renderVersion();
  setLotValue('Zero');
}

function updateActiveLot(){
  const activeButton=rows.querySelector('.is-current .win');
  if(activeButton){
    setLotValue(formatLot(calcLot(Number(activeButton.dataset.risk))));
    return;
  }
  setLotValue('Zero');
}

minus.onclick=()=>{
  sl.value=Math.max(10,(Number(sl.value)||BASE_SL_PIPS)-10);
  updateMinusState();
  updateActiveLot();
};
document.getElementById('plus').onclick=()=>{
  sl.value=(Number(sl.value)||BASE_SL_PIPS)+10;
  updateMinusState();
  updateActiveLot();
};
rows.addEventListener('click',event=>{
  const btn=event.target.closest('.win');
  if(!btn)return;
  const row=btn.closest('tr');
  const isActive=btn.classList.contains('is-active');

  if(isActive){
    const isCurrent=row.classList.contains('is-current');
    btn.classList.remove('is-active');
    btn.setAttribute('aria-pressed','false');
    row.classList.remove('is-current');
    row.classList.add('row-disabled');
    if(isCurrent)setLotValue('Zero');
    return;
  }

  rows.querySelectorAll('.is-current').forEach(currentRow=>{
    currentRow.classList.remove('is-current');
  });

  row.classList.remove('row-disabled');
  row.classList.add('is-current');
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed','true');
  setLotValue(formatLot(calcLot(Number(btn.dataset.risk))));
});
version.onchange=()=>{
  setSettingsEditing(false);
  renderVersion();
};
settingsButton.onclick=()=>{
  if(isEditingSettings){
    saveSettings();
    return;
  }
  startEditingSettings();
};
duplicateVersionButton.onclick=duplicateCurrentVersion;
addRowButton.onclick=addRiskRow;
deleteRowButton.onclick=deleteLastRiskRow;
document.getElementById('reset').onclick=()=>{
  setSettingsEditing(false);
  sl.value=BASE_SL_PIPS;
  version.value='Accelerate';
  updateMinusState();
  resetTable();
};

restoreCustomVersions();
restoreVersionSettings();
renderVersion();
updateMinusState();
tableFontSize.value=Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--table-font-size')));
rowHeight.value=Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--table-row-height')));
restoreSliderValue(tableFontSize,TABLE_FONT_SIZE_STORAGE_KEY);
restoreSliderValue(rowHeight,ROW_HEIGHT_STORAGE_KEY);
function bindSlider(slider,update){
  slider.addEventListener('input',function(){update(true);});
  slider.addEventListener('change',function(){update(true);});
}
bindSlider(tableFontSize,updateTableFontSize);
bindSlider(rowHeight,updateRowHeight);
updateTableFontSize();
updateRowHeight();
