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
const minus=document.getElementById('minus');
const tableFontSize=document.getElementById('table-font-size');
const rowHeight=document.getElementById('row-height');

const BASE_LOT=0.01;
const BASE_SL_PIPS=40;
const BASE_LOSS=4;
const TABLE_FONT_SIZE_STORAGE_KEY='risk-calculator-table-font-size';
const ROW_HEIGHT_STORAGE_KEY='risk-calculator-row-height';

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

const formatCurrency=value=>`$${value.toLocaleString('en-US')}`;
const slPips=()=>Math.max(1,Number(sl.value)||BASE_SL_PIPS);
const calcLot=risk=>BASE_LOT*(risk/BASE_LOSS)*(BASE_SL_PIPS/slPips());
const formatLot=value=>value.toFixed(2);
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
  if(save){
    try{
      localStorage.setItem(ROW_HEIGHT_STORAGE_KEY,String(height));
    }catch{}
  }
}

function updateTableFontSize(save=false){
  const fontSize=Number(tableFontSize.value);
  document.documentElement.style.setProperty('--table-font-size',`${fontSize}px`);
  updateSliderProgress(tableFontSize);
  if(save){
    try{
      localStorage.setItem(TABLE_FONT_SIZE_STORAGE_KEY,String(fontSize));
    }catch{}
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
  }catch{}
}

const WIN_ICON=`<svg viewBox="0 0 32 32"><path d="M3 25l8-9 5 4 9-12"/><path d="M20 8h5v5"/></svg>`;

function renderVersion(){
  const config=versions[version.value];
  if(!config)return;

  initialBalance.textContent=formatCurrency(config.initialBalance);
  baseRisk.textContent=formatCurrency(config.baseRisk);
  rr.textContent=`1 : ${config.riskReward}`;
  versionLabel.textContent=config.label;
  versionInfo.setAttribute('aria-label',config.description);
  versionTooltip.innerHTML=config.tooltip;
  rows.innerHTML=config.risks.map((risk,index)=>{
    const lotSize=formatLot(calcLot(risk));
    return `<tr class="row-disabled">
      <td>${index+1}</td>
      <td>${formatCurrency(risk)}</td>
      <td>${formatCurrency(risk*config.riskReward)}</td>
      <td class="action-cell">
        <div class="action-buttons">
          <button class="action-btn win" type="button" data-risk="${risk}" aria-label="Lot size ${lotSize}" aria-pressed="false">${WIN_ICON}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  setLotValue(formatLot(calcLot(config.risks[0])));
}

function resetTable(){
  renderVersion();
  setLotValue('Zero');
}

minus.onclick=()=>{
  sl.value=Math.max(10,(Number(sl.value)||BASE_SL_PIPS)-10);
  updateMinusState();
  resetTable();
};
document.getElementById('plus').onclick=()=>{
  sl.value=(Number(sl.value)||BASE_SL_PIPS)+10;
  updateMinusState();
  resetTable();
};
rows.addEventListener('click',event=>{
  const btn=event.target.closest('.win');
  if(!btn)return;
  const row=btn.closest('tr');
  const isEnabled=row.classList.contains('row-disabled');

  rows.querySelectorAll('.is-current').forEach(currentRow=>{
    currentRow.classList.remove('is-current');
  });
  row.classList.toggle('row-disabled',!isEnabled);
  btn.classList.toggle('is-active',isEnabled);
  btn.setAttribute('aria-pressed',String(isEnabled));
  if(isEnabled)row.classList.add('is-current');
  const activeButton=rows.querySelector('.win.is-active');
  setLotValue(activeButton
    ? formatLot(calcLot(Number(activeButton.dataset.risk)))
    : 'Zero');
});
version.onchange=renderVersion;
document.getElementById('reset').onclick=()=>{
  sl.value=BASE_SL_PIPS;
  version.value='Accelerate';
  updateMinusState();
  resetTable();
};

renderVersion();
setLotValue('Zero');
updateMinusState();
tableFontSize.value=Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--table-font-size')));
rowHeight.value=Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--table-row-height')));
restoreSliderValue(tableFontSize,TABLE_FONT_SIZE_STORAGE_KEY);
restoreSliderValue(rowHeight,ROW_HEIGHT_STORAGE_KEY);
tableFontSize.addEventListener('input',()=>updateTableFontSize(true));
rowHeight.addEventListener('input',()=>updateRowHeight(true));
updateTableFontSize();
updateRowHeight();
