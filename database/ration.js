const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , available = require('./available')
  , rationCalculator = require('ration_calculator')
  ;
 
async function get(email, token) {
  let userData = await user.get(email, token, { userData: 1 })
    , diary = await getDiary(userData._id);

  let today = new Date().toISOString();
  
  let addToDatabase = (diary.length == 0);
  if (!addToDatabase) {
    addToDatabase = true;

    diary.forEach(day => {
      if (day.date == today) {
        addToDatabase = false;
      }
    });
  }

  if (addToDatabase) {
    let availableArr = await available.getAvailable(userData._id);
    await calculateAndSaveRation(userData._id, today, userData.userData.nutrition, availableArr);
    diary = getDiary(userData._id)
  }

  return diary;
}

async function add(id, obj) {
  let collection = mongo.user()
    , query = { '_id': mongodb.ObjectId(id) }
    , upd = { $push: { 'ration': obj } }
    ;

  res = await collection.findOneAndUpdate(query, upd);
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function update(id, foodId, field, value) {
  let collection = mongo.user()
    , query = { 
        '_id': mongodb.ObjectId(id),
        'ration.food': foodId
      }
    , upd = {}
    ;

  upd['ration.$.' + field] = value;
  res = await collection.findOneAndUpdate(query, { $set: upd });
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function prep(email, token, days) {
  let userData = await user.get(email, token, { userData: 1, nutrition: 1 });
  let availableArr = await available.getAvailable(userData._id);
  
  let date = new Date().toISOString();
  for (let i = 0; i < days; i++) {
    await calculateAndSaveRation(userData._id, date, userData.userData.nutrition, availableArr);
    //date += day
    //reserve available
  }
}

/** 
 * cast user nutrition to addon required format 
 * @param {*} nutrition : nutrition from UserData (format is different from food nutrition)
 * @todo float arithmetic operations, better to keep values in database
*/
function userToAddonNutrition(userNutrition) {
  return {
    calories: {
      total: userNutrition.calories
    },
    carbs: {
      total: userNutrition.carbs.kcal
    },
    fats: {
      total: userNutrition.fats.kcal
    },
    proteins: userNutrition.proteins.kcal
  }
}

/**
 * aggregates diary with appropriate data substitution
 * @param {*} userId ObjectId
 */
async function getDiary(userId) {
  return await mongo.diary().aggregate([
    { $match: { userId: userId } },
    { $lookup: {
        from: "Food",
        localField: "ration.ration.food",
        foreignField: "_id",
        as: "ration.foods"
      }
    },
    { $addFields: { "ration.ration.food": { $arrayElemAt: ["$ration.foods", 0] } }}, 
    { $project: { "_id": 0, "userId": 0, "ration.foods": 0 } }
  ]).toArray();
}

/**
 * calculates ration and saves in database
 * @param {*} userId 
 * @param {*} date
 * @param {*} nutrition 
 * @param {*} available 
 */
async function calculateAndSaveRation(userId, date, nutrition, available) {
  let rationRes = await rationCalculator.calculateRation(userToAddonNutrition(nutrition), available);
    
  rationRes.ration.forEach((el) => {
    el.food = mongodb.ObjectId(el.food)
  })
  rationRes.nutrition = {
    calories: {
      total: rationRes.nutrition.calories
    },
    carbs: {
      total: rationRes.nutrition.carbs
    },
    fats: {
      total: rationRes.nutrition.fats
    },
    proteins: rationRes.nutrition.proteins
  }

  mongo.diary().insertOne({
    userId: userId,
    date: date,
    ration: rationRes
  });
}


exports.get = get;
exports.add = add;
exports.update = update;
exports.prep = prep;