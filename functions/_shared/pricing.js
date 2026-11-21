
// Server-side price validation. Never trust cart prices sent by the browser.
const direct = {
  p1:1850000,p2:3020000,p3:950000,p4:2350000,p5:2370000,
  p6:1850000,p7:2880000,p8:3180000,p9:2250000,p10:3550000,
  p11:3500000,p12:2650000,p13:3680000,p14:2580000,p15:1990000,
  p16:2590000,p17:4150000,p18:2510000,p19:2860000,p20:6069000,
  p21:5844400,p22:1871000,p23:2160000,p24:2860900,p25:1910000,
  p26:6129000,p27:1350000,p28:4165000,p29:5950000,p30:4400000,
  p31:1600000,p32:2290000,p33:2350000,p34:2150000,p35:2240000,
  p36:4480000,p37:3600000,p38:2790000,p39:5580000,p40:3085000,
  p41:2450000,p42:4450000,p43:3600000,p44:362600,p45:1000000,
  p46:1900000,p47:1500000,p48:1658000,p49:2360000,p50:5627910,
  p51:1832960,p52:1832960,p53:1546660,p54:1998200,p55:1998200,
  p56:1093420,p57:3041490,p58:1263750,p59:2859420,p60:2669520,
  p61:3536760,p62:2394020,p63:1742075,p64:3496000,p65:4450000,
  p66:21118700,p67:14582500,p68:39684300,p69:21118700,
  p70:14407400,p71:2095400,p72:3486180,p73:2241200,p74:3070200,
  p75:2778600,p76:3486180,p77:2241200,p78:3499860,p79:3753400,
  p80:4801720,p81:38564900,p82:20183500,p83:14401400,p84:36937500,
  p85:21018700,p86:21622500,p87:21018700,p88:32181300,p89:35150000,
  p90:36937500,p91:14201400,p92:2764020,p93:17929600,p94:3792720,
  p95:2246520,p96:2332940,p97:2158580,p98:2730000,p99:4803160,
  p100:4203320,p101:3347220,p102:21622500,p103:2953530
};

const boneBase={8:3500000,10:4000000,12:5000000,14:6000000,16:7000000,18:8000000,20:9000000,22:10000000,24:11000000,26:12000000,28:13000000,30:14000000,32:16000000,34:17000000,36:19000000};
const pixieBase={8:4500000,10:5500000,12:6000000,14:7000000,16:7500000,18:9500000,20:10500000,22:11500000,24:14500000,26:16500000,28:19500000,30:22500000};

const boneClosures={
  '2x6':[[10,12,3500000],[14,18,7500000],[20,24,7500000],[26,30,10000000]],
  '5x5':[[10,12,7500000],[14,18,8500000],[20,24,12000000],[26,30,17500000]],
  '13x4':{10:8000000,12:9000000,14:9500000,16:10500000,18:11500000,20:13000000,22:16500000,24:18000000,26:19000000,28:21500000,30:24000000}
};

const pixieClosures={
  '5x5':{12:4000000,14:4500000,16:5500000,18:6000000,20:7000000,22:8000000,24:9500000},
  '13x4':{10:4500000,12:5000000,14:5500000,16:7000000,18:8500000,20:10000000,22:12000000}
};

function extra(table,type,len){
  if(type==='none')return 0;
  const x=table[type];
  if(Array.isArray(x)){
    const a=x.find(([lo,hi])=>len>=lo&&len<=hi);
    return a?a[2]:null;
  }
  return x?.[len]??null;
}

export function priceCart(items){
  if(!Array.isArray(items)||!items.length||items.length>50)throw new Error('Invalid cart');
  let total=0;
  const lines=[];

  for(const item of items){
    let unit=0,qty=1;
    const name=String(item.name||'').slice(0,180);
    let data={};

    if(item.kind==='direct'){
      const cents=direct[item.id];
      if(!cents)throw new Error('This product is not enabled for online checkout yet: '+name);
      unit=cents;
    }else if(item.kind==='hair-bone'||item.kind==='hair-pixie'){
      const len=Number(item.length);
      const weight=Number(item.weight);
      const sets=Number(item.sets);
      const type=String(item.closure||'none');

      if(!Number.isInteger(weight)||weight<200||weight>5000||weight%100||!Number.isInteger(sets)||sets<1||sets>10)throw new Error('Invalid hair selection');

      const base=item.kind==='hair-bone'?boneBase[len]:pixieBase[len];
      const add=extra(item.kind==='hair-bone'?boneClosures:pixieClosures,type,len);

      if(!base||add===null)throw new Error('Unavailable hair length or closure');

      unit=(base*(weight/100)+add)*sets;
      qty=1;
      data={
        length:len,
        weight,
        sets,
        closure:type,
        colour:item.kind==='hair-bone'?String(item.colour):'Black'
      };
    }else{
      throw new Error('Unsupported item type');
    }

    total+=unit*qty;
    lines.push({
      name,
      qty,
      unit_amount_kobo:unit,
      product_id:item.id||null,
      item_data:JSON.stringify(data)
    });
  }

  if(!Number.isSafeInteger(total)||total<10000)throw new Error('Invalid total');
  return {total,lines};
}
