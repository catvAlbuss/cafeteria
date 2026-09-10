import{r as e}from"./rolldown-runtime-hePW80VL.js";import{d as t,f as n,n as r,t as i}from"./jsx-runtime-DALT1WEO.js";import{t as a}from"./circle-check-big-DbmfDrob.js";import{n as o,t as ee}from"./smartphone-BlVAkQgN.js";import{t as s}from"./key-round-Bzi8aw1M.js";import{t as c}from"./printer-VngsR26x.js";import{t as l}from"./x-RLS0eKcZ.js";import{L as u}from"./app-DA5Hchhw.js";var d=r(),f=e(t(),1),p=i();function m(e){let t=(0,d.c)(51),{isOpen:r,mesa:i,pedido:m,onClose:v,onSuccess:y}=e,[b,x]=(0,f.useState)(`efectivo`),[S,C]=(0,f.useState)(``),[w,T]=(0,f.useState)(``),[E,D]=(0,f.useState)(!1),[O,k]=(0,f.useState)(!1),A=(0,f.useRef)(null),j;t[0]!==r||t[1]!==i?(j=()=>{r&&i&&(k(!1),D(!1),x(`efectivo`),C(``),T(``))},t[0]=r,t[1]=i,t[2]=j):j=t[2];let M=i?.id,N;if(t[3]!==r||t[4]!==M?(N=[r,M],t[3]=r,t[4]=M,t[5]=N):N=t[5],(0,f.useEffect)(j,N),!r||!i)return null;let P,F,I,L;if(t[6]!==w||t[7]!==E||t[8]!==O||t[9]!==i.id||t[10]!==i.mesero||t[11]!==i.numero||t[12]!==b||t[13]!==S||t[14]!==v||t[15]!==y||t[16]!==m){let e=m||[],r=_,d;t[21]===Symbol.for(`react.memo_cache_sentinel`)?(d=(e,t)=>e+r(t.total),t[21]=d):d=t[21];let f=e.reduce(d,0),j;t[22]===Symbol.for(`react.memo_cache_sentinel`)?(j=(e,t)=>e+r(t.subtotal),t[22]=j):j=t[22];let M=e.reduce(j,0),N;t[23]===Symbol.for(`react.memo_cache_sentinel`)?(N=(e,t)=>e+r(t.igv),t[23]=N):N=t[23];let R=e.reduce(N,0),z=f>0&&M===0&&R===0?f-f/1.18:R,B=M>0?M:f-z,V=e.flatMap(g),H=parseFloat(S)||0,U=H-f,W=()=>{D(!0);let t=e.filter(h);if(t.length===0){alert(`No hay pedidos disponibles para cobrar.`),D(!1);return}let r={metodo_pago:b,pedido_ids:t.map(ne),authorization_pin:w};n.patch(`/mesas/${i.id}/cobrar`,r,{onSuccess:()=>{if(A.current){let e=window.open(``,`_blank`);e&&(e.document.write(`
                        <html>
                            <head>
                                <title>Comprobante de Pago</title>
                                <style>
                                    * { margin: 0; padding: 0; box-sizing: border-box; }
                                    body { 
                                    font-family: 'Segoe UI', Arial, sans-serif;
                                    background: white;
                                    display: flex;
                                    justify-content: center;
                                    align-items: flex-start;
                                    min-height: 100vh;
                                    padding: 10px;
                                    margin: 0;
                                    }
                                    .ticket-print {
                                    width: 80mm;
                                    min-height: 220mm;
                                    padding: 8px 6px;
                                    background: white;
                                    border-radius: 8px;
                                    ox-shadow: none;
                                    margin: 0 auto;
                                    }
                                    .text-center { text-align: center; }
                                    .text-right { text-align: right; }
                                    .font-bold { font-weight: 700; }
                                    .uppercase { text-transform: uppercase; }
                                    .mb-1 { margin-bottom: 4px; }
                                    .mb-2 { margin-bottom: 8px; }
                                    .mb-3 { margin-bottom: 12px; }
                                    .pb-1 { padding-bottom: 4px; }
                                    .pb-2 { padding-bottom: 8px; }
                                    .pb-3 { padding-bottom: 12px; }
                                    .pt-1 { padding-top: 4px; }
                                    .pt-2 { padding-top: 8px; }
                                    .pt-3 { padding-top: 12px; }
                                    .text-dark { color: #1a1a1a; }
                                    .text-gray { color: #555; }
                                    .text-muted { color: #777; }
                                    .text-sm { font-size: 11px; }
                                    .text-base { font-size: 13px; }
                                    .text-lg { font-size: 15px; }
                                    .text-xl { font-size: 18px; }
                                    .tracking-wide { letter-spacing: 1.5px; }
                                    .shop-name { 
                                        font-size: 18px; 
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 2px;
                                    }
                                    .shop-address {
                                        font-size: 11px;
                                        color: #444;
                                        margin-top: 2px;
                                    }
                                    .shop-phone {
                                        font-size: 11px;
                                        color: #444;
                                    }
                                    .title {
                                        font-size: 13px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1.5px;
                                    }
                                    .date-time {
                                        font-size: 11px;
                                        color: #555;
                                        margin-top: 2px;
                                    }
                                    .table-header {
                                        font-size: 12px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1px;
                                    }
                                    .product-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 13px;
                                        padding: 2px 0;
                                        color: #1a1a1a;
                                    }
                                    .product-name { flex: 1; color: #1a1a1a; }
                                    .product-price {
                                        font-weight: 600;
                                        min-width: 60px;
                                        text-align: right;
                                        color: #1a1a1a;
                                    }
                                    .total-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 16px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        padding: 4px 0;
                                    }
                                    .payment-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 13px;
                                        padding: 3px 0;
                                        color: #1a1a1a;
                                    }
                                    .payment-label { color: #444; }
                                    .payment-value { font-weight: 600; color: #1a1a1a; }
                                    .payment-method-value {
                                        color: #1a1a1a;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                    }
                                    .footer-text {
                                        font-size: 14px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1.5px;
                                    }
                                    .footer-attended {
                                        font-size: 11px;
                                        color: #444;
                                        margin-top: 3px;
                                    }
                                    .divider-dashed {
                                        border: none;
                                        border-bottom: 1.5px dashed #ccc;
                                        margin: 6px 0;
                                    }
                                    .divider-dashed-thick {
                                        border: none;
                                        border-bottom: 2px dashed #ccc;
                                        margin: 8px 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="ticket-print">${A.current.innerHTML}</div>
                            </body>
                        </html>
                    `),e.document.close(),e.focus(),setTimeout(()=>{e.print()},500))}D(!1),k(!0),setTimeout(()=>{y()},1200)},onError:e=>{console.log(`❌ Error al registrar la venta:`,e),D(!1),alert(`Error al registrar la venta: `+Object.values(e).join(` `))}})},G;t[24]!==O||t[25]!==v?(G=()=>{O||v()},t[24]=O,t[25]=v,t[26]=G):G=t[26];let K=G,q,J;if(t[27]===Symbol.for(`react.memo_cache_sentinel`)){let e=new Date;q=e.toLocaleDateString(`es-PE`,{day:`2-digit`,month:`2-digit`,year:`numeric`}),J=e.toLocaleTimeString(`es-PE`,{hour:`2-digit`,minute:`2-digit`,hour12:!0}),t[27]=q,t[28]=J}else q=t[27],J=t[28];let re=J;L=`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`,P=`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[95vh] flex flex-col`;let Y;t[29]===i.numero?Y=t[30]:(Y=(0,p.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white`,children:i.numero}),t[29]=i.numero,t[30]=Y);let X;t[31]===Symbol.for(`react.memo_cache_sentinel`)?(X=(0,p.jsx)(`p`,{className:`text-sm font-bold text-[#2D1B1A]`,children:`DOLCE CAFEE`}),t[31]=X):X=t[31];let Z;t[32]===i.numero?Z=t[33]:(Z=(0,p.jsxs)(`div`,{children:[X,(0,p.jsxs)(`p`,{className:`text-[10px] text-gray-400`,children:[`Mesa #`,i.numero]})]}),t[32]=i.numero,t[33]=Z);let Q;t[34]!==Y||t[35]!==Z?(Q=(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[Y,Z]}),t[34]=Y,t[35]=Z,t[36]=Q):Q=t[36];let $;t[37]!==E||t[38]!==O||t[39]!==K?($=!O&&(0,p.jsx)(`button`,{onClick:K,className:`flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-600`,disabled:E,children:(0,p.jsx)(l,{className:`h-4 w-4`})}),t[37]=E,t[38]=O,t[39]=K,t[40]=$):$=t[40],t[41]!==Q||t[42]!==$?(F=(0,p.jsxs)(`div`,{className:`flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-[#FBF7F0] px-5 py-3`,children:[Q,$]}),t[41]=Q,t[42]=$,t[43]=F):F=t[43],I=O?(0,p.jsxs)(`div`,{className:`p-8 text-center`,children:[(0,p.jsx)(`div`,{className:`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100`,children:(0,p.jsx)(a,{className:`h-12 w-12 text-green-600`})}),(0,p.jsx)(`h3`,{className:`text-2xl font-bold text-gray-900`,children:`¡Cobro exitoso! 🎉`}),(0,p.jsxs)(`p`,{className:`mt-2 text-gray-500`,children:[`Mesa #`,i.numero,` liberada`]}),(0,p.jsxs)(`div`,{className:`mt-4 rounded-xl bg-gray-50 p-4`,children:[(0,p.jsx)(`p`,{className:`text-sm text-gray-500`,children:`Total cobrado`}),(0,p.jsxs)(`p`,{className:`text-2xl font-bold text-[#C9A96E]`,children:[`S/ `,f.toFixed(2)]}),(0,p.jsx)(`p`,{className:`mt-1 text-xs text-gray-400`,children:`Comprobante impreso`})]}),(0,p.jsx)(`button`,{onClick:()=>{v(),n.reload()},className:`mt-6 w-full rounded-xl bg-[#C9A96E] py-3 font-semibold text-white transition hover:bg-[#B8975D]`,children:`✅ Aceptar`})]}):(0,p.jsxs)(`div`,{className:`p-4 space-y-3 overflow-y-auto flex-1`,children:[(0,p.jsxs)(`div`,{ref:A,className:`rounded-xl border border-gray-200 bg-white p-4`,id:`ticket-print`,children:[(0,p.jsxs)(`div`,{className:`text-center pb-1 mb-1`,style:{borderBottom:`1.5px dashed #ccc`},children:[(0,p.jsx)(`p`,{style:{fontSize:`18px`,fontWeight:700,color:`#000000`,letterSpacing:`2px`},children:`DOLCE CAFE`}),(0,p.jsx)(`p`,{style:{fontSize:`11px`,color:`#333333`},children:`Av. Principal 123, Lima`}),(0,p.jsx)(`p`,{style:{fontSize:`11px`,color:`#333333`},children:`Telp. 11223344`})]}),(0,p.jsxs)(`div`,{className:`text-center pb-1 mb-1`,style:{borderBottom:`1.5px dashed #ccc`},children:[(0,p.jsx)(`p`,{style:{fontSize:`13px`,fontWeight:700,color:`#000000`,letterSpacing:`1.5px`},children:`COMPROBANTE DE PAGO`}),(0,p.jsxs)(`p`,{style:{fontSize:`11px`,color:`#444444`},children:[q,` `,re]})]}),(0,p.jsxs)(`div`,{className:`mb-1`,children:[(0,p.jsxs)(`div`,{className:`flex justify-between pb-0.5 mb-0.5`,style:{borderBottom:`1.5px solid #ddd`},children:[(0,p.jsx)(`span`,{style:{fontSize:`12px`,fontWeight:700,color:`#000000`,letterSpacing:`1px`},children:`DESCRIPCIÓN`}),(0,p.jsx)(`span`,{style:{fontSize:`12px`,fontWeight:700,color:`#000000`,letterSpacing:`1px`},children:`PRECIO`})]}),V.length>0?V.map(te):(0,p.jsx)(`p`,{style:{textAlign:`center`,color:`#666`,fontSize:`12px`},children:`Sin productos`})]}),(0,p.jsxs)(`div`,{className:`pt-1 mb-1`,style:{borderTop:`2px dashed #ccc`},children:[(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsx)(`span`,{style:{color:`#333333`},children:`Subtotal`}),(0,p.jsx)(`span`,{style:{fontWeight:600,color:`#000000`},children:B.toFixed(2)})]}),(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsx)(`span`,{style:{color:`#333333`},children:`IGV (18%)`}),(0,p.jsx)(`span`,{style:{fontWeight:600,color:`#000000`},children:z.toFixed(2)})]}),(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`16px`,fontWeight:700,color:`#000000`,padding:`2px 0`},children:[(0,p.jsx)(`span`,{style:{color:`#000000`},children:`TOTAL`}),(0,p.jsx)(`span`,{style:{color:`#000000`},children:f.toFixed(2)})]})]}),b===`efectivo`&&H>0&&(0,p.jsxs)(`div`,{className:`pt-1 mb-1`,style:{borderTop:`1.5px dashed #ccc`},children:[(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsx)(`span`,{style:{color:`#333333`},children:`Efectivo`}),(0,p.jsx)(`span`,{style:{fontWeight:600,color:`#000000`},children:H.toFixed(2)})]}),(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsx)(`span`,{style:{color:`#333333`},children:`Cambio`}),(0,p.jsx)(`span`,{style:{fontWeight:700,color:`#000000`},children:U.toFixed(2)})]})]}),(0,p.jsx)(`div`,{className:`pt-1 mb-1`,style:{borderTop:`1.5px dashed #ccc`},children:(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsx)(`span`,{style:{color:`#333333`},children:`Método de pago`}),(0,p.jsx)(`span`,{style:{fontWeight:700,color:`#000000`,textTransform:`uppercase`},children:b})]})}),(0,p.jsxs)(`div`,{className:`text-center pt-1`,style:{borderTop:`2px dashed #ccc`},children:[(0,p.jsx)(`p`,{style:{fontSize:`14px`,fontWeight:700,color:`#000000`,letterSpacing:`1.5px`},children:`¡GRACIAS POR SU VISITA!`}),(0,p.jsx)(`p`,{style:{fontSize:`11px`,color:`#333333`},children:i.mesero?`Atendido por: ${i.mesero}`:`Esperamos verlo pronto`})]})]}),(0,p.jsxs)(`div`,{className:`grid flex-shrink-0 grid-cols-3 gap-2`,children:[(0,p.jsxs)(`button`,{onClick:()=>x(`efectivo`),className:`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${b===`efectivo`?`bg-[#C9A96E] text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:[(0,p.jsx)(u,{className:`h-4 w-4`}),(0,p.jsx)(`span`,{children:`Efectivo`})]}),(0,p.jsxs)(`button`,{onClick:()=>x(`tarjeta`),className:`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${b===`tarjeta`?`bg-[#C9A96E] text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:[(0,p.jsx)(o,{className:`h-4 w-4`}),(0,p.jsx)(`span`,{children:`Tarjeta`})]}),(0,p.jsxs)(`button`,{onClick:()=>x(`yape`),className:`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${b===`yape`?`bg-[#C9A96E] text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:[(0,p.jsx)(ee,{className:`h-4 w-4`}),(0,p.jsx)(`span`,{children:`Yape/Plin`})]})]}),b===`efectivo`&&(0,p.jsxs)(`div`,{className:`flex-shrink-0`,children:[(0,p.jsx)(`label`,{className:`mb-1 block text-xs font-medium text-gray-600`,children:`Efectivo recibido`}),(0,p.jsxs)(`div`,{className:`relative`,children:[(0,p.jsx)(`span`,{className:`absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-gray-400`,children:`S/`}),(0,p.jsx)(`input`,{type:`number`,step:`0.01`,placeholder:`0.00`,className:`w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-4 pl-8 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]`,value:S,onChange:e=>C(e.target.value)})]}),S&&H>0&&U>=0&&(0,p.jsxs)(`div`,{className:`mt-1 flex justify-between px-1 text-sm`,children:[(0,p.jsx)(`span`,{className:`text-gray-500`,children:`Cambio`}),(0,p.jsxs)(`span`,{className:`font-bold text-[#C9A96E]`,children:[`S/ `,U.toFixed(2)]})]}),H>0&&U<0&&(0,p.jsx)(`p`,{className:`mt-1 text-xs text-red-500`,children:`El monto recibido es menor al total`})]}),(0,p.jsxs)(`div`,{className:`flex-shrink-0`,children:[(0,p.jsx)(`label`,{className:`mb-1 block text-xs font-medium text-gray-600`,children:`PIN de autorización`}),(0,p.jsxs)(`div`,{className:`relative`,children:[(0,p.jsx)(s,{className:`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400`}),(0,p.jsx)(`input`,{type:`password`,inputMode:`numeric`,maxLength:4,autoComplete:`off`,placeholder:`••••`,className:`w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-center text-sm tracking-[0.5em] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]`,value:w,onChange:e=>T(e.target.value.replace(/\D/g,``).slice(0,4))})]})]}),(0,p.jsx)(`button`,{onClick:W,disabled:E||w.length!==4||b===`efectivo`&&H<f,className:`flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${E||b===`efectivo`&&H<f?`cursor-not-allowed bg-gray-300`:`bg-[#2D1B1A] text-white hover:bg-[#1A0F0E]`}`,children:E?(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`div`,{className:`h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent`}),`Procesando...`]}):(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(c,{className:`h-4 w-4`}),`Cobrar e Imprimir`]})})]}),t[6]=w,t[7]=E,t[8]=O,t[9]=i.id,t[10]=i.mesero,t[11]=i.numero,t[12]=b,t[13]=S,t[14]=v,t[15]=y,t[16]=m,t[17]=P,t[18]=F,t[19]=I,t[20]=L}else P=t[17],F=t[18],I=t[19],L=t[20];let R;t[44]!==P||t[45]!==F||t[46]!==I?(R=(0,p.jsxs)(`div`,{className:P,children:[F,I]}),t[44]=P,t[45]=F,t[46]=I,t[47]=R):R=t[47];let z;return t[48]!==L||t[49]!==R?(z=(0,p.jsx)(`div`,{className:L,children:R}),t[48]=L,t[49]=R,t[50]=z):z=t[50],z}function te(e,t){return(0,p.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,padding:`1px 0`,color:`#000000`},children:[(0,p.jsxs)(`span`,{style:{flex:1,color:`#000000`},children:[e.cantidad,`x `,e.nombre]}),(0,p.jsx)(`span`,{style:{fontWeight:600,minWidth:`60px`,textAlign:`right`,color:`#000000`},children:e.subtotal.toFixed(2)})]},t)}function ne(e){return e.id}function h(e){return![`pagado`,`cancelado`].includes(e.estado||``)}function g(e){return typeof e.productos==`string`?JSON.parse(e.productos):e.productos}function _(e){return typeof e==`number`?e:parseFloat(e)||0}export{m as t};