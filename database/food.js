const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  ;
 
async function get(id, projection) {
  let query = mongodb.ObjectId(id)
    , opts = { projection: projection }
    , collection = mongo.food()
    , res = await collection.findOne(query, opts)
    ;

  return res;
}

async function insert(obj) {
  let collection = mongo.food()
    , res = await collection.insertOne(obj);
    ;

  if (res.insertedCount != 1) {
    throw new Error('Insertion error');
  }
  
  return mongodb.ObjectId(res.insertedId);
}

function update (id, field, val) {
  let updObj = {};
  updObj[field] = val;
  
  const query = {
    "_id": mongodb.ObjectId(id)
  };

  const update = {
    $set: updObj
  };

  return new Promise((rslv, rjct) => {
    let collection = mongo.food();
    collection.findOneAndUpdate(query, update, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found');
        return;
      }

      rslv('success');
    });
  });
}

async function search (query, lang) {
  return new Promise((rslv, rjct) => {
    try {
      let regexp = new RegExp(query);

      const localLang = `name.${lang}`;
      const queryObj = {}
      queryObj[localLang] = { $regex: regexp, $options: 'i' };
      const allQueries = [queryObj, { 'name.en': { $regex: regexp, $options: 'i' }}]
      mongo.food().aggregate([
        { $match: { $or: allQueries } }, 
        { $addFields: { 'name': {
              $cond: { 
                if: '$name.' + lang, 
                then: '$name.' + lang, 
                else: '$name.en' 
              } 
            }
          }
        },
        { $project: { "name": 1, "type": 1, 'nutrition': 1 } },
      ]).toArray()
      .then(res => {
        rslv(res);
      })
      .catch(err => {
        rjct(err);
      });
    }
    catch(err) {
      rjct(err);
    }
  });
}

exports.get = get;
exports.insert = insert;
exports.update = update;
exports.search = search;
