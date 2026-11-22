// Aqua City sitesi: balik cetveli, rehber karti ve gun seridi.
// Veriler sayfaya derleme sirasinda uygulamanin kendi dosyalarindan gomulur
// (bkz. site/build.mjs); burada yalniz gosterilir.
(function () {
  'use strict'

  var bugun = new Date()

  // --- Gun seridi: sayilarin yerine gun adlari ------------------------------
  var GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  var hucreler = document.querySelectorAll('.gunler [data-gun]')
  for (var h = 0; h < hucreler.length; h++) {
    var fark = Number(hucreler[h].getAttribute('data-gun'))
    if (fark === 0 || fark === -1) continue
    var gun = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + fark)
    hucreler[h].textContent = GUNLER[gun.getDay()]
  }

  // --- Cetvel ve rehber karti ------------------------------------------------
  var cetvel = document.querySelector('.cetvel')
  var kaynak = document.getElementById('cetvel-verisi')
  if (!cetvel || !kaynak) return

  var turler
  try {
    turler = JSON.parse(kaynak.textContent)
  } catch (e) {
    return
  }

  var kok = document.querySelector('link[rel="icon"]').getAttribute('href').replace('assets/img/favicon.png', '')
  var balik = cetvel.querySelector('.cetvel__balik')
  var ad = cetvel.querySelector('.cetvel__ad')
  var bilimsel = cetvel.querySelector('.cetvel__bilimsel')
  var veri = cetvel.querySelector('.cetvel__veri')
  var sinirEtiket = cetvel.querySelector('.cetvel__sinir span')
  var damga = cetvel.querySelector('.cetvel__damga')
  var dugmeler = cetvel.querySelectorAll('.tur')

  var kart = cetvel.querySelector('.kart')
  var kartDurum = cetvel.querySelector('.kart__durum')
  var kartYer = cetvel.querySelector('.kart__yer')
  var kartYem = cetvel.querySelector('.kart__yem')
  var kartAy = cetvel.querySelector('.ay')
  var kartAyNot = cetvel.querySelector('.ay__not')
  var kartAv = cetvel.querySelectorAll('.kart__av')

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  var AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

  function gorselYolu(t) {
    return new URL(kok + 'assets/img/fish/' + t.id + '.webp', document.baseURI).href
  }

  // Gorselleri onceden indir: tur degisince bos kare gorunmesin.
  turler.forEach(function (t) {
    new Image().src = gorselYolu(t)
  })

  function boyYaz(cm) {
    return String(cm).replace('.', ',') + ' cm'
  }

  function satir(baslik, deger, sinif) {
    var kutu = document.createElement('div')
    if (sinif) kutu.className = sinif
    var dt = document.createElement('dt')
    dt.textContent = baslik
    var dd = document.createElement('dd')
    dd.textContent = deger
    kutu.appendChild(dt)
    kutu.appendChild(dd)
    return kutu
  }

  // Uygulamadaki hesabin aynisi (fish_regulations.dart, isBannedCurrently):
  // yasak penceresi yil sonunu asabilir (or. 15 Aralik - 31 Mart).
  function bugunYasak(t) {
    if (!t.pencere) return false
    var simdi = (bugun.getMonth() + 1) * 100 + bugun.getDate()
    var bas = t.pencere[0] * 100 + t.pencere[1]
    var son = t.pencere[2] * 100 + t.pencere[3]
    return bas <= son ? simdi >= bas && simdi <= son : simdi >= bas || simdi <= son
  }

  function kartiYaz(t) {
    if (!kart) return
    var durum
    var sinif = ''
    if (t.korumada) {
      durum = 'Koruma altında. Avlanamaz.'
      sinif = 'yasak'
    } else if (bugunYasak(t)) {
      durum = 'Av yasağı yürürlükte: ' + t.yasak + '.'
      sinif = 'yasak'
    } else if (t.yasak) {
      durum = 'Serbest. Sezonluk yasağı var: ' + t.yasak + '.'
      sinif = 'uyari'
    } else {
      durum = 'Boy ve limit kurallarına uyarak avlanabilir.'
    }
    kartDurum.textContent = ''
    var tarih = document.createElement('b')
    tarih.textContent = 'Bugün, ' + bugun.getDate() + ' ' + AY_KISA[bugun.getMonth()]
    kartDurum.appendChild(tarih)
    kartDurum.appendChild(document.createTextNode(durum))
    kartDurum.className = 'kart__durum' + (sinif ? ' ' + sinif : '')

    kartYer.textContent = t.habitat

    // Koruma altindaki turde av taktigi gosterilmez (uygulamada da oyle).
    for (var i = 0; i < kartAv.length; i++) kartAv[i].hidden = !!t.korumada
    kart.classList.toggle('kart--korumada', !!t.korumada)

    kartYem.textContent = ''
    ;(t.yemler || []).forEach(function (yem) {
      var li = document.createElement('li')
      li.textContent = yem
      kartYem.appendChild(li)
    })

    kartAy.textContent = ''
    var buAy = bugun.getMonth() + 1
    for (var a = 1; a <= 12; a++) {
      var kutu = document.createElement('li')
      var dolu = (t.aylar || []).indexOf(a) !== -1
      kutu.textContent = AY_KISA[a - 1].charAt(0)
      kutu.title = AYLAR[a - 1]
      kutu.setAttribute('aria-label', AYLAR[a - 1] + (dolu ? ', verimli' : ''))
      kutu.className = (dolu ? 'dolu' : '') + (a === buAy ? ' simdi' : '')
      kartAy.appendChild(kutu)
    }
    kartAyNot.textContent = (t.aylar || []).indexOf(buAy) !== -1 ? AYLAR[buAy - 1] + ' verimli aylardan.' : ''

    kart.hidden = false
  }

  function goster(sira) {
    var t = turler[sira]
    if (!t) return

    ad.textContent = t.kisa
    bilimsel.textContent = ''
    var latince = document.createElement('i')
    latince.textContent = t.bilimsel
    bilimsel.appendChild(latince)
    if (t.ek) bilimsel.appendChild(document.createTextNode(' · ' + t.ek))

    veri.textContent = ''
    veri.appendChild(satir('Yasal en küçük boy', t.korumada ? 'Yok' : t.boy ? boyYaz(t.boy) : 'Boy sınırı yok'))
    veri.appendChild(satir('Limit', t.limit, t.korumada ? 'yasak' : ''))
    veri.appendChild(satir('Av yasağı', t.yasak || 'Yok', t.yasak ? 'yasak' : ''))

    cetvel.classList.toggle('korumada', !!t.korumada)
    damga.hidden = !t.korumada

    cetvel.style.setProperty('--cm', t.cm)
    cetvel.style.setProperty('--oran', t.oran)
    var maske = 'url("' + gorselYolu(t) + '")'
    balik.style.webkitMaskImage = maske
    balik.style.maskImage = maske
    if (t.boy) {
      cetvel.style.setProperty('--boy', t.boy)
      sinirEtiket.textContent = boyYaz(t.boy)
    }
    balik.setAttribute('aria-label', t.kisa + (t.boy ? ', cetvelde ' + boyYaz(t.boy) + ' boyunda' : ''))

    kartiYaz(t)

    for (var i = 0; i < dugmeler.length; i++) {
      dugmeler[i].setAttribute('aria-pressed', String(i === sira))
    }
  }

  var bekleyen
  cetvel.addEventListener('click', function (olay) {
    var dugme = olay.target.closest('.tur')
    if (!dugme) return
    var sira = Number(dugme.getAttribute('data-tur'))
    cetvel.classList.add('degisiyor')
    clearTimeout(bekleyen)
    bekleyen = setTimeout(function () {
      goster(sira)
      cetvel.classList.remove('degisiyor')
    }, 170)
  })

  goster(0)
})()
