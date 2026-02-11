class ConceptLoader {
  constructor() {
    this.cache = {};
    this.categories = {
      'Animals': 'Animals_16.json',
      'Artifacts': 'Artifacts_22.json',
      'Electronic Components': 'Electronic Components_10.json',
      'Food': 'Food_33_.json',
      'Landforms': 'Landforms_15_.json',
      'People Social': 'People Social_18.json',
      'Plants': 'Plants_8.json',
      'Sports': 'Sports_8.json',
      'Stationery': 'Stationery_7.json',
      'Sundries': 'sundries_12.json',
      'Tools': 'Tools_19.json'
    };
    this.basePath = './sup/concept_data/en_substaintive_noun_220/';

    this.builtinData = {
      'Animals': [
        ["parrot","crow"],["shark","whale"],["wolf","tiger"],["elephant","giraffe"],
        ["lion","tiger"],["tiger","lion"],["snake","lizard"],["fox","coyote"],
        ["bee","butterfly"],["goose","duck"],["elephant","mammoth"],["lion","rhino"],
        ["toad","frog"],["turtle","tortoise"],["moth","butterfly"]
      ],
      'Artifacts': [
        ["cup","bowl"],["chair","table"],["vacuum","broom"],["car","bus"],
        ["boat","ship"],["bike","scooter"],["plane","helicopter"],["truck","car"],
        ["train","subway"],["table","desk"],["cabinet","wardrobe"],["stool","bench"],
        ["paperclip","flannel"],["fork","spoon"],["bed","pillow"],["lamp","lightbulb"],
        ["camera","lens"],["bed","mattress"],["cabinet","wardrobe"],["pillow","cushion"],
        ["sculpture","statue"],["clock","watch"]
      ],
      'Electronic Components': [
        ["amplifier","oscillator"],["resistor","capacitor"],["transistor","diode"],
        ["voltmeter","ammeter"],["inductor","transformer"],["voltage","current"],
        ["microprocessor","microcontroller"],["inductor","coil"],["light","bulb"],
        ["microchip","processor"]
      ],
      'Food': [
        ["bread","cake"],["apple","pear"],["pineapple","mango"],["cherry","blueberry"],
        ["noodle","pasta"],["Zongzi","mooncake"],["Macaron","cookie"],["Jam","juice"],
        ["Pepper Powder","Mustard"],["pear","peach"],["salad","soup"],["cherry","walnut"],
        ["cake","pie"],["banana","kiwi"],["tomato","potato"],["rice","wheat"],
        ["beef","pork"],["bread","pasta"],["wine","beer"],["tea","coffee"],
        ["peach","plum"],["apple","orange"],["pea","bean"],["chicken","turkey"],
        ["chicken","beef"],["salmon","tuna"],["pills","tablets"],["pill","capsule"],
        ["ice cream","Yogurt"],["Smoothie","juice"],["pizza","lasagna"],
        ["sandwich","hamburger"],["dumplings","wonton"]
      ],
      'Landforms': [
        ["continent","island"],["desert","oasis"],["mountain","hill"],["river","lake"],
        ["valley","plain"],["peninsula","isthmus"],["valley","canyon"],["peninsula","cape"],
        ["island","archipelago"],["desert","sand"],["river","stream"],["valley","canyon"],
        ["valley","plain"],["ocean","sea"],["desert","sandbeach"]
      ],
      'People Social': [
        ["upper","elite"],["aristocrat","noble"],["peasant","farmer"],
        ["proletariat","worker"],["gentry","landowner"],["middle-class","upper-middle-class"],
        ["bourgeoisie","middleclass"],["proletariat","workingclass"],["elite","upperclass"],
        ["peasant","serf"],["proletariat","working"],["bourgeoisie","merchant"],
        ["bourgeoisie","elite"],["chef","cook"],["architect","designer"],
        ["doctor","physician"],["teacher","professor"],["lawyer","attorney"]
      ],
      'Plants': [
        ["fern","palm"],["tree","bush"],["rose","tulip"],["maple","oak"],
        ["birch","willow"],["cherry","walnut"],["birch","aspen"],["Pine","cypress"]
      ],
      'Sports': [
        ["skateboard","skis"],["surfboard","paddleboard"],["skateboard","rollerblades"],
        ["football","rugby"],["Baseball","Cricket"],["boxing","Taekwondo"],
        ["wrestling","judo"],["surfing","windsurfing"]
      ],
      'Stationery': [
        ["eraser","ruler"],["marker","highlighter"],["stapler","clip"],
        ["notepad","notebook"],["marker","crayon"],["stapler","paperclip"]
      ],
      'Sundries': [
        ["prescription","medication"],["rain","drizzle"],["Library","bookstore"],
        ["vampire","werewolf"],["bicyle","motorcycle"],["museum","gallery"],
        ["hospital","clinic"],["shampoo","conditioner"],["Bakery","Cafe"],
        ["doctor","nurse"],["painting","drawing"],["garden","park"],
        ["gouache","watercolor"]
      ],
      'Tools': [
        ["saw","chisel"],["file","grinder"],["hammer","axe"],["screwdriver","drill"],
        ["chisel","plane"],["saw","blade"],["pliers","tongs"],["saw","scissors"],
        ["shovel","rake"],["scalpel","scissors"],["eraser","sharpener"],["file","grinder"],
        ["wrench","spanner"],["pliers","wrench"],["scalpel","forceps"],
        ["bandage","gauze"],["syringe","needle"],["stethoscope","thermometer"]
      ]
    };
  }

  async loadCategory(category) {
    if (this.cache[category]) {
      return this.cache[category];
    }

    const filename = this.categories[category];
    if (!filename) {
      throw new Error('Unknown category: ' + category);
    }

    try {
      const response = await fetch(this.basePath + filename);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const data = await response.json();
      this.cache[category] = data;
      return data;
    } catch (error) {
      console.warn('Fetch failed for ' + category + ', using builtin data:', error.message);
      if (this.builtinData[category]) {
        this.cache[category] = this.builtinData[category];
        return this.builtinData[category];
      }
      throw error;
    }
  }

  async getRandomPair(category) {
    const pairs = await this.loadCategory(category);
    const randomIndex = Math.floor(Math.random() * pairs.length);
    return {
      conceptA: pairs[randomIndex][0],
      conceptB: pairs[randomIndex][1],
      index: randomIndex
    };
  }

  async getPairByIndex(category, index) {
    const pairs = await this.loadCategory(category);
    if (index < 0 || index >= pairs.length) {
      throw new Error('Invalid index ' + index + ' for category ' + category);
    }
    return {
      conceptA: pairs[index][0],
      conceptB: pairs[index][1],
      index: index
    };
  }

  async getAllPairs(category) {
    const pairs = await this.loadCategory(category);
    return pairs.map(function(pair, index) {
      return {
        conceptA: pair[0],
        conceptB: pair[1],
        index: index
      };
    });
  }

  getAvailableCategories() {
    return Object.keys(this.categories);
  }

  async getCategorySize(category) {
    const pairs = await this.loadCategory(category);
    return pairs.length;
  }

  clearCache() {
    this.cache = {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConceptLoader;
}
