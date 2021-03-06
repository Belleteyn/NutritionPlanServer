function routerMountPoint(depObj) {
  if (!validateConnect(depObj)) throw new Error('Argument object must contain router and model props');

  const router = depObj.express.Router();

  router.use('/', require('./root')(depObj.express.Router()));
  router.use('/auth', require('./auth')(depObj.express));
  router.use('/api', require('./api')(depObj.express));
  router.use('/usda_api', require('./usda_api')(depObj.express));

  return router;
};

function validateConnect(dObj) {
  return dObj.hasOwnProperty('express') ? 1 : 0;
}

module.exports = routerMountPoint;

/*
const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , foodCollection = require('./../database/food')
  , userCollection = require('./../database/user')
  , pantry = require('./../database/pantry')
  , ration = require('./../database/ration')
  , translate = require('translate')
  , router = express.Router()
  ;

translate.engine = process.env.TRANSLATE_ENGINE;
translate.key = process.env.TRANSLATE_ENGINE_KEY;

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.status(code).send('Error: ' + code + ' -> ' + info);
}

async function apiToLocalFormat(obj) {
  let local = {};
  local['name'] = {
    en: obj.name,
    ru: await translate(obj.name, 'ru')
  };
  
  //TODO: преобразовать с учетом наличия полей (ставить нулями отсутствующие)
  //TODO: учитывать размерность (unit)

  local['group'] = obj.group;
  local['nutrition'] = {
    calories: {
      total: obj.nutrition['Energy'],
      fromFat: obj.nutrition['Total lipid (fat)'] * 9
    },
    proteins: obj.nutrition.Protein,
    carbs: {
      total: obj.nutrition['Carbohydrate, by difference'],
      dietaryFiber: obj.nutrition['Fiber, total dietary'],
      sugars: obj.nutrition['Sugars, total']
    },
    fats: {
      total: obj.nutrition['Total lipid (fat)'],
      saturated: obj.nutrition['Fatty acids, total saturated'],
      trans: obj.nutrition['Fatty acids, total trans'],
      polyunsanurated: obj.nutrition['Fatty acids, total polyunsaturated'],
      monounsaturated: obj.nutrition['Fatty acids, total monounsaturated']
    },
    calcium: obj.nutrition['Calcium, Ca'],
    iron: obj.nutrition['Iron, Fe'],
    magnesium: obj.nutrition['Magnesium, Mg'],
    phosphorous: obj.nutrition['Phosphorus, P'],
    potassium: obj.nutrition['Potassium, K'],
    sodium: obj.nutrition['Sodium, Na'],
    zinc: obj.nutrition['Zinc, Zn'],
    thiamin: obj.nutrition['Thiamin'],
    riboflavin: obj.nutrition['Riboflavin'],
    niacin: obj.nutrition['Niacin'],
    cholesterol: obj.nutrition['Cholesterol'],
    caffeinne: obj.nutrition['Caffeine'],
    vitamins: {
      c: obj.nutrition['Vitamin C, total ascorbic acid'],
      b6: obj.nutrition['Vitamin B-6'],
      folate: obj.nutrition['Folate, DFE'],
      b12: obj.nutrition['Vitamin B-12'],
      arae: obj.nutrition['Vitamin A, RAE'],
      aiu: obj.nutrition['Vitamin A, IU'],
      e: obj.nutrition['Vitamin E (alpha-tocopherol)'],
      d2d3: obj.nutrition['Vitamin D (D2 + D3)'],
      d: obj.nutrition['Vitamin D'],
      k: obj.nutrition['Vitamin K (phylloquinone)'],
    }
  };

  local['measures'] = obj.measures;
  local['lastUsedDate'] = 0;

  return local;
}

async function searchFood(response, arg, id) {
  try {
    console.log(`search ${arg}, id: ${id}`);
    let searchRes = await foodCollection.search(arg);
    let pantryObj = await pantry.get(id);

    let searchResFix = searchRes.map(element => {

      function isIdEqual(pElement) {
        if (pElement.foodId === element.id) {
          return true;
        }
        return false;
      }

      if (pantryObj.some(isIdEqual)) {
        element.contains = true;
      }
      else {
        element.contains = false;
      }

      return element;
    });

    response.send(searchResFix);
  }
  catch(err) {
    handleError(response, 400, err);
  }
}

router.get('/foodSearch', function(req, res, next) {
  try {
    let searchArg = req.query['search']
      , id = req.query['id']
      ;

    searchFood(res, searchArg, id);
  }
  catch(err) {
    handleError(res, 400, err);
  }
})

router.get('/ration', async function(req, res, next) {
  try {
    let id = req.query['id'];
    let result = await ration.get(id);
    res.send(result);
  } catch (err) {
    handleError(res, 400, err);
  }
});

router.get('/idealNutrition', function(req, res, next) {
  let id = req.query['id']
    , projection = { nutrition: 1 }
    ;

  userCollection.get(id, projection)
  .then(result => {
    res.send(result.nutrition);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

router.post('/updatePantryInfo', async (req, res) => {
  const data = req.body;
  try {
    await pantry.update(data.userId, data.updOid, data.field, data.value);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

router.post('/addToPantry', async (req, res) => {
  const data = req.body;
  try {
    let pantryObj = {
      foodId: data.foodId,
      available: 0,
      delta: 0,
      daily: {
        min: 0
      }
    };

    console.log(`add to pantry: ${data.foodId}, from user ${data.userId}`);
    await pantry.insert(data.userId, pantryObj)
    res.sendStatus(200);
  } catch (error) {
    handleError(res, 400, error);
  }
});

router.post('/updateFoodInfo', (req, res) => {
  const data = req.body;
  
  foodCollection.update(data.updOid, data.field, data.val)
  .then(result => {
    res.send(result);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

module.exports = router;
*/