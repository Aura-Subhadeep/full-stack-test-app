const express = require('express')
const router = express.Router()
const catchAsync = require('../utils/catchAsync')
const ExpressError = require('../utils/ExpressError')
const Campground = require('../models/campground')
const {campgroundSchema} = require('../schemas.js')
const {isLoggedIn} = require('../middleware')

// Validate new campground
const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

// Campgrounds route
router.get('/', async(req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', {campgrounds})
})

// New route
router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new')
})

// POST New campground
router.post('/', isLoggedIn, validateCampground, catchAsync (async(req, res, next) => {
    const campground = new Campground(req.body.campground)
    campground.author = req.user._id
    await campground.save()
    req.flash('success','Succesfully created campground')
    res.redirect(`/campgrounds/${campground._id}`)
}))

// Show route
router.get('/:id', catchAsync (async(req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews').populate('author')
    if(!campground){
        req.flash('error', 'Cannot find that campground')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', {campground})
}))

// Edit New campground
router.get('/:id/edit', isLoggedIn, catchAsync (async(req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash('sccess', 'Canot find that campground')
        return res.redirect('/campgrounds')
    }
    if (!campground.author.equals(req.user._id)) {
        req.flash('success', 'You dont have permission to do that!')
        return res.redirect(`/campgrounds/${id}`)
    } 
    res.render('campgrounds/edit', {campground})
}))

// PUT Update (Edit) campground
router.put('/:id', validateCampground, catchAsync (async(req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id)
    if (!campground.author.equals(req.user._id)) {
        req.flash('success', 'You dont have permission to do that!')
        return res.redirect(`/campgrounds/${id}`)
    }
    const camp = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    req.flash('success', 'Campground edited successfully')
    res.redirect(`/campgrounds/${campground._id}`)
}))

// Delete campground
router.delete('/:id/', isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id)
    if (!campground.author.equals(req.user._id)) {
        req.flash('success', 'You dont have permission to do that!')
        return res.redirect(`/campground/${id}`)
    }
    await Campground.findByIdAndDelete(id)
    req.flash('success', 'Campground deleted opps')
    res.redirect('/campgrounds')
}))

module.exports = router