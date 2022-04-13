class apiFeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }
    search(){
        const keyword = this.queryString.keyword?{
            name:{
                $regex:this.queryString.keyword,
                $options: 'i',
                
            }
        }:{}
        this.query = this.query.find({...keyword})
        return this
    }
    filter(){
        let queryCopy = {...this.queryString}
        const removeFields = ["keyword", "page", "limit"]

        removeFields.forEach(key=>delete queryCopy[key])
        console.log(queryCopy);

        queryCopy = JSON.stringify(queryCopy);
        queryCopy = queryCopy.replace(
            /\b(gt|gte|lt|lte)\b/g,
            key=>`$${key}`
        )
        console.log(queryCopy);
        this.query = this.query.find(JSON.parse(queryCopy))
        return this
    } 
    pagination(resultPerPage){
        const curentPage = Number(this.queryString.page) || 1
        const skip = resultPerPage*(curentPage - 1)
        this.query = this.query.limit(resultPerPage).skip(skip)
        return this
    }
}

module.exports = apiFeatures;