class BattleStats {
  constructor(){
    this.recorded = false;
    this.activeStatsPack = "12";
  }

  beginGame(){
    this.recorded = false;
  }

  getNumber(name){
    var value = getCookie(name);
    return value.length == 0 ? 0 : parseInt(value[0]) || 0;
  }

  getList(name){
    return getCookie(name).filter(function(value){ return value.length > 0; });
  }

  unlockCombo(combo){
    var unlocked = this.getList("qqxunlockedcombos");
    var id = combo.getId();
    if(!unlocked.includes(id)){
      unlocked.push(id);
      setCookie("qqxunlockedcombos", unlocked);
    }
  }

  recordGame(player){
    if(this.recorded) return;
    this.recorded = true;

    var packKey = model.pack.join("");
    setCookie("qqxgamesplayed", [this.getNumber("qqxgamesplayed") + 1]);
    setCookie("qqxgamesplayed" + packKey, [this.getNumber("qqxgamesplayed" + packKey) + 1]);

    var completedIDs = player.completeCombos.map(function(combo){ return combo.getId(); });
    var unlocked = this.getList("qqxunlockedcombos");
    for(var i=0; i<completedIDs.length; i++)
      if(!unlocked.includes(completedIDs[i]))
        unlocked.push(completedIDs[i]);
    setCookie("qqxunlockedcombos", unlocked);

    var highScore = this.getNumber("qqxhighscore" + packKey);
    if(player.score > highScore){
      setCookie("qqxhighscore" + packKey, [player.score]);
      setCookie("qqxhighscorecombos" + packKey, completedIDs);
    }
  }

  getSelectedPacks(){
    var packID = getInput("packinput") || "p12";
    return packID.substring(1).split("").map(Number);
  }

  getAvailableCombos(packs){
    var names = [];
    for(var i=0; i<packs.length; i++){
      var chars = COMMON_CHAR_LIST[packs[i]-1];
      for(var j=0; j<chars.length; j++)
        names.push(chars[j][1]);
    }
    return COMBO_LIST.filter(function(combo){
      return combo[0].every(function(name){ return names.includes(name); });
    });
  }

  comboNameByID(id){
    for(var i=0; i<COMBO_LIST.length; i++)
      if(COMBO_LIST[i][3] == id)
        return COMBO_LIST[i][1];
    return null;
  }

  findComboByID(id){
    for(var i=0; i<COMBO_LIST.length; i++)
      if(COMBO_LIST[i][3] == id)
        return COMBO_LIST[i];
    return null;
  }

  findCharacter(name){
    for(var i=0; i<COMMON_CHAR_LIST.length; i++)
      for(var j=0; j<COMMON_CHAR_LIST[i].length; j++)
        if(COMMON_CHAR_LIST[i][j][1] == name)
          return COMMON_CHAR_LIST[i][j];
    return null;
  }

  createComboCard(combo){
    var card = document.createElement("div");
    card.classList.add("combocard", "stats-combo-card");
    var images = card.appendChild(document.createElement("div"));
    var details = card.appendChild(document.createElement("div"));
    var info = details.appendChild(document.createElement("div"));
    info.id = "combocardinfo";
    var name = info.appendChild(document.createElement("div"));
    name.textContent = combo[1];
    var score = info.appendChild(document.createElement("div"));
    score.textContent = combo[2];
    var characters = details.appendChild(document.createElement("div"));
    characters.id = "combocardchars";

    for(var i=0; i<combo[0].length; i++){
      var character = this.findCharacter(combo[0][i]);
      if(character != null){
        var portrait = images.appendChild(document.createElement("div"));
        portrait.classList.add("thumbnailcard");
        portrait.style.backgroundImage = "url('img/" + character[0] + ".jpg')";
      }
      var characterName = characters.appendChild(document.createElement("span"));
      characterName.classList.add("ismine");
      characterName.textContent = combo[0][i];
    }
    return card;
  }

  createLockedComboCard(){
    var card = document.createElement("div");
    card.classList.add("combocard", "stats-combo-card", "stats-locked-combo");
    card.textContent = "？？？";
    return card;
  }

  renderComboCards(container, combos, unlocked){
    container.textContent = "";
    if(combos.length == 0){
      container.textContent = "暂无";
      return;
    }
    for(var i=0; i<combos.length; i++)
      container.appendChild(unlocked == null || unlocked.includes(combos[i][3])
        ? this.createComboCard(combos[i])
        : this.createLockedComboCard());
  }

  showPackStats(packKey){
    this.activeStatsPack = packKey;
    var tabs = document.querySelectorAll("#battleStatsTabs button");
    for(var i=0; i<tabs.length; i++)
      tabs[i].classList.toggle("active", tabs[i].dataset.pack == packKey);

    var previousPacks = model.pack ? model.pack.slice() : this.getSelectedPacks();
    var packs = packKey.split("").map(Number);
    model.setPack(packs);
    var catalog = this.getAvailableCombos(packs);

    var summary = document.getElementById("battleStatsSummary");
    summary.textContent = "";
    var values = [
      ["已玩局数", this.getNumber("qqxgamesplayed" + packKey)],
      [packKey.split("").join("+") + " 最高分", this.getNumber("qqxhighscore" + packKey)]
    ];
    for(var i=0; i<values.length; i++){
      var item = document.createElement("div");
      var label = item.appendChild(document.createElement("div"));
      var value = item.appendChild(document.createElement("div"));
      label.textContent = values[i][0];
      value.textContent = values[i][1];
      value.classList.add("battle-stat-value");
      summary.appendChild(item);
    }

    var bestIDs = this.getList("qqxhighscorecombos" + packKey);
    var bestCombos = [];
    for(var i=0; i<bestIDs.length; i++){
      var combo = catalog.find(function(item){ return item[3] == bestIDs[i]; });
      if(combo != null && !bestCombos.includes(combo)) bestCombos.push(combo);
    }
    this.renderComboCards(document.getElementById("battleStatsBestCombos"), bestCombos, null);

    var unlocked = this.getList("qqxunlockedcombos");
    this.renderComboCards(document.getElementById("battleStatsCombos"), catalog, unlocked);
    model.setPack(previousPacks);
  }

  unlockAllSpecials(){
    var answer = window.prompt("岑缨的叔叔是谁？");
    if(answer == null) return;
    if(answer.trim() != "岑青岩"){
      window.alert("回答错误，未解锁珍稀牌。");
      return;
    }
    for(var i=0; i<SPECIAL_CHAR_LIST.length; i++)
      setCookie("qqxspecials" + (i+1), SPECIAL_CHAR_LIST[i]);
    window.alert("已解锁全部珍稀牌，请刷新网站以加载珍稀牌。");
  }

  resetAllData(){
    var answer = window.prompt("竹笋包子杂耍团团长是谁？");
    if(answer == null) return;
    if(answer.trim() != "团子"){
      window.alert("回答错误，未重置数据。");
      return;
    }
    var cookies = document.cookie.split(";");
    for(var i=0; i<cookies.length; i++){
      var name = cookies[i].split("=")[0].trim();
      if(name.length > 0) setCookie(name, [], -1);
    }
    window.alert("游戏数据已重置。");
    window.location.reload();
  }

  show(){
    this.showPackStats(this.getSelectedPacks().join(""));

    document.getElementById("battleStatsPanel").style.visibility = "visible";
  }

  hide(){
    document.getElementById("battleStatsPanel").style.visibility = "hidden";
  }
}
