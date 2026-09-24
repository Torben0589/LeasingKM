function compare() {
let a = vehicles.find(v => v.id === $('mVA').value),
b = vehicles.find(v => v.id === $('mVB').value),
ea = e('A'),
eb = e('B'),
add = $('mAdd').checked;

// Debug-Ausgabe
console.log("COMPARE DEBUG:", { a, b, ea, eb, add });

// Validierung 1: Fahrzeuge prüfen
if (!a || !b || a.id === b.id) {
const msg = 'Bitte zwei verschiedene Fahrzeuge wählen.';
$('mErr').textContent = msg;
alert(msg);
return;
}

// Validierung 2: Eingaben prüfen
if (eb === null || (add && ea === null)) {
const msg = 'Bitte Verbrauch und Preis vollständig eingeben.';
$('mErr').textContent = msg;
alert(msg);
return;
}

let ma = +a.overage_eur_km || 0,
ta = ma + (add ? ea : 0),
tb = eb,
w = ta <= tb ? a : b,
d = Math.abs(ta - tb),
st = sv();

// Speichern
st[a.id] = {
d: $('mDA').value,
c: +$('mCA').value || 0,
p: +$('mPA').value || 0,
a: add
};
st[b.id] = {
d: $('mDB').value,
c: +$('mCB').value || 0,
p: +$('mPB').value || 0
};
localStorage.setItem(K, JSON.stringify(st));

// Ergebnis anzeigen
$('mWin').textContent =
w.id === a.id
? `Der Mehrkilometer mit ${a.short_name || a.name} ist günstiger.`
: `${b.short_name || b.name} ist für den zusätzlichen Kilometer günstiger.`;

$('mNA').textContent = a.short_name || a.name;
$('mNB').textContent = b.short_name || b.name;
$('mTA').textContent = ct(ta);
$('mTB').textContent = ct(tb);

$('mCapA').textContent = add
? 'Mehrkilometer + Energie/Kraftstoff'
: 'nur Mehrkilometerpreis';

$('mDiff').innerHTML = `Differenz: <b>${ct(d)}</b>`;

$('mBreak').textContent = add
? `${a.short_name || a.name}: ${ct(ma)} Mehrkilometer + ${ct(ea)} Energie/Kraftstoff. ${b.short_name || b.name}: ${ct(eb)} Energie/Kraftstoff.`
: `${a.short_name || a.name}: ${ct(ma)} Mehrkilometerpreis. ${b.short_name || b.name}: ${ct(eb)} Energie/Kraftstoff.`;

$('mFormula').textContent =
`${(+$('mCB').value).toLocaleString('de-DE')}/100 km × ` +
`${(+$('mPB').value).toLocaleString('de-DE')} € ÷ 100 = ` +
`${eb.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} €/km beim Alternativfahrzeug.`;

$('mErr').textContent = '';
$('mRes').classList.add('show');
}
