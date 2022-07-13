const userModel = require("../models/userModel");
const booksModel = require("../models/booksModel");
const reviewModel = require("../models/reviewModel");

const createBook = async function (req, res) {
    try {
        let data = req.body

        if (!data.title || data.title.trim().length == 0) { return res.status(400).send({ status: false, message: "Title field is required" }) };

        if (!data.excerpt || data.excerpt.trim().length == 0) { return res.status(400).send({ status: false, message: "Excerpt field is required" }) };

        if (!data.userId || data.userId.trim().length == 0) { return res.status(400).send({ status: false, message: "UserId field is required" }) };

        if (!data.ISBN || data.ISBN.trim().length == 0) { return res.status(400).send({ status: false, message: "ISBN field is required" }) };

        if (!data.category || data.category.trim().length == 0) { return res.status(400).send({ status: false, message: "Category field is required" }) };

        if (!data.subcategory || data.subcategory.length == 0) { return res.status(400).send({ status: false, message: "Subcategory field is required" }) };

        if (!data.releasedAt || data.releasedAt.length == 0) { return res.status(400).send({ status: false, message: "releasedAt field is required" }) };
        if(data.reviews){
            if(!data.reviews==0){return res.status(400).send({status:false, message:"Reviews field should be in default 0"})}
        }
        if(data.isDeleted){
            if(!data.isDeleted==false){return res.status(400).send({status:false, message:"isDeleted field should be in by default false"})}
        }
        //title and ISBN is unique or not
        let titleCheck = await booksModel.findOne({ title: data.title });
        if (titleCheck) { return res.status(400).send({ status: false, message: "Title is already registerd, try anothor" }) };

        let isbnCheck = await booksModel.findOne({ ISBN: data.ISBN });
        if (isbnCheck) { return res.status(400).send({ status: false, message: "ISBN is already registerd, try anothor" }) };


        if (!(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)/.test(data.ISBN))) { return res.status(400).send({ status: false, message: "ISBN should be in Number type and its length should be in 13 digits" }) };

        if (!(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(data.releasedAt))) { return res.status(400).send({ status: false, message: "ReleasedAt format should be in YYYY-MM-DD" }) };

        //objectId valid or not and its length
        let userdata = req.body.userId
        if (!(/^[0-9a-fA-F]{24}$/.test(userdata))) { return res.status(400).send({ status: false, message: "userId format isn't correct" }) }

        let objectIdCheck = await userModel.findById({ _id: userdata });
        if (!(objectIdCheck)) { return res.status(404).send({ status: false, message: "UserId is not valid" }) };

        //after checking all validation than we structure our response data in JSON objectId from(key value pairs)
        let saveData = await booksModel.create(data)

        { return res.status(201).send({ status: true, message: "Success", data: saveData }) };
    }
    catch (err) {
        { return res.status(500).send({ status: false, message: "Error", error: err.message }) }
    }
};

const getBook = async function (req, res) {
    try {

        if (req.query.userId) {

            let userId1 = req.query.userId

            if (!(/^[0-9a-fA-F]{24}$/.test(userId1))) { return res.status(400).send({ status: false, message: "userId format isn't correct" }) }

            let userIdCheck = await userModel.findById({ _id: userId1 })
            if (!userIdCheck) { return res.status(404).send({ status: false, message: "userId is not exist" }) }

            let bookData = await booksModel.find({ userId: userIdCheck, isDeleted: false }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })

            if (bookData.length == 0) {
                return res.status(404).send({ status: false, message: "No such Books are found for this userId" })
            } else {
                return res.status(200).send({ status: true, message: "Books List", data: bookData })
            }
        }

        else if (req.query.category) {

            let category = req.query.category

            let categoryCheck = await booksModel.find({ category: category, isDeleted: false }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })

            if (categoryCheck.length == 0) {
                return res.status(404).send({ status: false, message: "No such similar books are found by the category" })
            } else {
                return res.status(200).send({ status: true, message: "Books List", data: categoryCheck })
            };
        
        }
        else if (req.query.subcategory) {

            let subcategory = req.query.subcategory

            let subcategoryCheck = await booksModel.find({ subcategory: subcategory, isDeleted: false }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })

            if (subcategoryCheck.length == 0) {
                return res.status(404).send({ status: false, message: "No such similar books are found by the subcategory" })
            } else {
                return res.status(200).send({ status: true, message: "Books List", data: subcategoryCheck })
            };
        }
        else {
           
            let finaldata= await booksModel.find({isDeleted:false})
            return res.status(200).send({ status:true, msg: "success", data:finaldata })
        }
    } catch (err) {
        return res.status(500).send({ message: "Error", error: err.message });
    }
};

const getBookById = async function (req, res) {
    try {
        let book_id = req.params.bookId;

        if (!(/^[0-9a-fA-F]{24}$/.test(book_id))) { return res.status(400).send({ status: false, message: "BookId format isn't correct" }) }

        let checkBook = await booksModel.findOne({ _id: book_id, isDeleted: false });

        if (!checkBook) { return res.status(404).send({ status: false, message: "BookId Not Found" }) };

        const getReviewsData = await reviewModel.find({ bookId: checkBook._id, isDeleted: false })

        const reviewsData = getReviewsData.map(review => {
            return {
                _id: review._id,
                bookId: review.bookId,
                reviewedBy: review.reviewedBy,
                reviewedAt: review.reviewedAt,
                rating: review.rating,
                review: review.review
            }
        });
        const data = {
            _id: checkBook._id,
            title: checkBook.title,
            excerpt: checkBook.excerpt,
            userId: checkBook.userId,
            category: checkBook.category,
            subcategory: checkBook.subcategory,
            isDeleted: checkBook.isDeleted,
            reviews: checkBook.reviews,
            releasedAt: checkBook.releasedAt,
            createdAt: checkBook.createdAt,
            updatedAt: checkBook.updatedAt,
            reviewsData: reviewsData.length == 0 ? [] : reviewsData
        };

        { return res.status(200).send({ status: true, message: "Books List", data: data }) };

    } catch (err) {
        { res.status(500).send({ status: false, error: err.message }) };
    }
};

const updateBook = async function (req, res) {
    try {
        let data = req.body
        let bookId = req.params.bookId

        if (!(/^[0-9a-fA-F]{24}$/.test(bookId))) { return res.status(400).send({ status: false, message: "BookId format isn't correct" }) }
        let book = await booksModel.findById({ _id: bookId })
        if (!book || book.isDeleted == true) { return res.status(404).send({ status: false, message: "No Book Found by this BookId" }) };

      

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please provide data in body" }) };

        let checkBook = await booksModel.findOne({ title: data.title })
        if (checkBook) { return res.status(400).send({ status: false, message: "Title is already used, try anothor" }) }

        let checkBook2 = await booksModel.findOne({ ISBN: data.ISBN })
        if (checkBook2) { return res.status(400).send({ status: false, message: "ISBN is already used, try another" }) }

        if (data.title ){
            if( data.title.trim().length == 0) { return res.status(400).send({ status: false, message: "Title requried" }) }
        }
         if (data.excerpt ){
           if( data.excerpt.trim().length == 0) { return res.status(400).send({ status: false, message: "Excerpt requried" }) }
         }
        if (data.ISBN ){
           if (!(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)/.test(data.ISBN))) { return res.status(400).send({ status: false, message: "ISBN should be in Number type and its length should be in 13 digits" }) };
        }
         if (data.releasedAt ){
            if (!(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(data.releasedAt))) { return res.status(400).send({ status: false, message: "ReleasedAt format should be in YYYY-MM-DD" }) };
         }
        


            let updatedBook = await booksModel.findOneAndUpdate({ _id: bookId }, { $set: { title: data.title, excerpt: data.excerpt, releasedAt: data.releasedAt, ISBN: data.ISBN } }, { new: true })

            { return res.status(200).send({ status: true, message: "Success", data: updatedBook }) };


    }
        
        catch (error) {
    { return res.status(500).send({ status: false, message: error.message }) }
}
};

const deleteBookById = async function (req, res) {
    try {
        let book_id = req.params.bookId;

        let checkBook = await booksModel.findOne({ _id: book_id, isDeleted: false });

        if (!checkBook) { return res.status(404).send({ status: false, message: "Book is already deleted" }) };

        const deleteBookData = await booksModel.findOneAndUpdate({ _id: checkBook._id }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })

        { return res.status(200).send({ status: true, message: "Book is deleted succesfully" }) };

    }
    catch (err) {
        { return res.status(500).send({ status: false, error: err.message }) };
    }
};

module.exports = { createBook, getBook, getBookById, updateBook, deleteBookById };
