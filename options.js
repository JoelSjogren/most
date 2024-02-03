function handle_input(e) {
    $("#custom-style")[0].innerHTML = $("#config-area")[0].value;
    $("#save")[0].disabled = false;
    
    repopulate_subtitles();
}

function repopulate_subtitles() {
    $(".most-subtitles").remove();
    
    var languages = get_used_languages();
    for (var i = 0; i < languages.length; i++) {
        var div = document.createElement("div");
        div.className = "most-subtitles most-" + languages[i];
        div.innerHTML = samples[languages[i]] ||
            "[No sample available for language " + languages[i] + ".]" +
            "<br>[Some more text.]";
        $("#most-overlay")[0].appendChild(div);
    }
}

function get_used_languages() {
    var result = [];
    var rules = $("#custom-style")[0].sheet.rules;
    for (var i = 0; i < rules.length; i++) {
        var re = /\.most-([A-z][A-z])\W/g;
        var m;
        while (m = re.exec(rules[i].selectorText + " ")) {
            if (result.indexOf(m[1]) == -1) {
                result.push(m[1]);
            }
        }
    }
    return result;
}

function restore_options() {
    with_style(function(style, is_default) {
        $("#custom-style")[0].innerHTML = style;
        $("#config-area")[0].innerHTML = style;
        if (is_default) {
            $("#remove")[0].disabled = true;
        }
        repopulate_subtitles();
    });
}

function save_options() {
    var customStyle = $("#custom-style")[0].innerHTML;
    
    chrome.storage.sync.set({customStyle: customStyle}, function() {
        $("#save")[0].disabled = true;
        $("#remove")[0].disabled = false;
    });

    // If an instance is already running, make the changes take effect immediately.
    chrome.runtime.sendMessage({ type: 'options update' }, result => { });
}

function remove_storage() {
    chrome.storage.sync.remove('customStyle');
    $("#remove")[0].disabled = true;
}

$("#config-area").on('input', handle_input);
document.addEventListener('DOMContentLoaded', restore_options);
$("#save")[0].addEventListener('click', save_options);
$("#remove")[0].addEventListener('click', remove_storage);






var samples = {
    ar: "ليس لديه أي أصدقاء في كوريا , لذلك على الأرجح لا يملك من يأكل معه",
    bg: "<i>Няма приятели в Корея, така че вероятно няма с кого да яде.</i>",
    cs: "<i>V Koreji nikoho nezná takže ani nemá s kým jíst.</i>",
    de: "<i> Er hat keine Freunde in Korea, also wird er wahrscheinlich niemanden haben, mit dem er was essen kann.</i>",
    el: "<i>Δεν έχει φίλους στην Κορέα, οπότε <br>πιθανόν να μην έχει παρέα για να φάει.</i>",
    en: "<i>He doesn't have any friends in Korea so he probably doesn't even have anyone to eat with.</i>",
    es: "<i>Él no tiene ningún amigo en Corea, así que,<br> probablemente no tiene a nadie con quien comer.</i>",
    et: "<i> Tal ei ole Koreas sõpru niiet tal ei ole arvatavasti isegi kellegagi koos süüa. </i>",
    fi: "<i>Hänellä ei edes ole ystäviä Koreassa, joten hänellä ei varmasti ole ystäviä, joiden kanssa käydä syömässä.</i>",
    fr: "<i>Il n'a aucun ami en Corée, alors il n'a probablement <br>personne avec qui manger.</i>",
    he: ". אין לו חברים בכל בקוריאה ולכן הוא כנראה אפילו לא צריך אף אחד לאכול איתו",
    hr: "<i> On nema prijatelja u Koreji, <br>tako da vjerojatno nema nikoga s kim bi jeo.</i>",
    hu: "<i>Nincs sok barátja Koreában, így ennie sincs kivel.</i>",
    id: "<i>Dia tidak punya teman satu pun di Korea, jadi dia mungkin tidak punya siapapun untuk makan dengannya.</i>",
    it: "<i>Non ha amici in Corea e probabilmente<br>non ha neanche qualcuno con cui mangiare.</i>",
    ja: "<i>韓国に友達がいないから<br>きっと一緒に食事する友達もいないんだわ</i>",
    lt: "<i>Jis Korėjoje neturi jokių draugų, todėl, ko gero, neturi su kuo pavalgyti.</i>",
    nl: "<i>Hij heeft geen vriendin in Korea, dus hij heeft waarschijnlijk niemand om mee samen te eten.</i>",
    pl: "<i>Nie ma żadnych przyjaciół w Korei, więc pewnie nie ma z kim zjeść.</i>",
    pt: "<i>Ele não tem nenhum amigo na Coreia, então provavelmente não tem ninguém com quem comer junto.</i>",
    ro: "<i>Nu are nici un prieten in Coreea, asa ca<br> probabil nu are cu cine sa manance.</i>",
    sh: "<i>Nema nikakve prijatelje u Koreji<br>sa kojima bi mogao da jede.</i>",
    sk: "<i>Nemá v Kórei veľa priateľov, takže<br> nemá ani s kým jesť.</i>",
    tl: "<i>May iba kaya siyang kaibigan sa Korea na kasabay niyang kumain.</i>",
    tr: "<i>Muhtemelen yemek için kimsesi yok bu yüzden Kore'de çok fazla arkadaşı bile yok.</i>",
    vi: "<i>Cậu ta không có người bạn nào ở Hàn vì thế cậu ấy có khả năng không có ai ăn cùng cả.</i>",
    zh: "在韩国没有朋友 应该没有能一起吃饭的人吧",
    zt: "在韓國沒有朋友 應該沒有能一起吃飯的人吧",
};
