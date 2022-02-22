import React, { Component } from 'react';
import Image from 'next/image'
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from "web3modal"
import { create as ipfsHttpClient } from 'ipfs-http-client'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import { withRouter } from 'next/router'

const CARD_ARRAY = [
    {
        name: 'fries',
        img: '/images/fries.png',
        description: ""
    },
    {
        name: 'cheeseburger',
        img: '/images/cheeseburger.png',
        description: ""
    },
    {
        name: 'ice-cream',
        img: '/images/ice-cream.png',
        description: ""
    },
    {
        name: 'pizza',
        img: '/images/pizza.png',
        description: ""
    },
    {
        name: 'milkshake',
        img: '/images/milkshake.png',
        description: ""
    },
    {
        name: 'hotdog',
        img: '/images/hotdog.png',
        description: ""
    },
    {
        name: 'fries',
        img: '/images/fries.png',
        description: ""
    },
    {
        name: 'cheeseburger',
        img: '/images/cheeseburger.png',
        description: ""
    },
    {
        name: 'ice-cream',
        img: '/images/ice-cream.png',
        description: ""
    },
    {
        name: 'pizza',
        img: '/images/pizza.png',
        description: ""
    },
    {
        name: 'milkshake',
        img: '/images/milkshake.png',
        description: ""
    },
    {
        name: 'hotdog',
        img: '/images/hotdog.png',
        description: ""
    }
]


export class game extends Component {
    constructor(props) {
        super(props)
        this.state = {
            account: '0x0',
            token: null,
            totalSupply: 0,
            tokenURIs: [],
            cardArray: [],
            cardsChosen: [],
            cardsChosenId: [],
            cardsWon: []
        }
    }

    componentWillMount() {

        this.setState({ cardArray: CARD_ARRAY.sort(() => 0.5 - Math.random()) })
    }
    chooseImage = (cardId) => {
        cardId = cardId.toString()
        if (this.state.cardsWon.includes(cardId)) {
            return window.location.origin + '/images/white.png'
        }
        else if (this.state.cardsChosenId.includes(cardId)) {
            return CARD_ARRAY[cardId].img
        } else {
            return window.location.origin + '/images/blank.png'
        }
    }

    async createMarket(token) {


        const data = JSON.stringify({
            token: token.name, description: token.description, image: token.img
        })
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
            this.createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    async createSale(url) {
        debugger
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        /* next, create the item */
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        let transaction = await contract.createToken(url)
        let tx = await transaction.wait()
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        const price = new ethers.utils.parseUnits("0.000000000000000001", 'ether')

        /* then list the item for sale on the marketplace */
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
        await transaction.wait()

        this.props.router.push('/')
    }

    flipCard = async (cardId) => {
        let alreadyChosen = this.state.cardsChosen.length

        this.setState({
            cardsChosen: [...this.state.cardsChosen, this.state.cardArray[cardId].name],
            cardsChosenId: [...this.state.cardsChosenId, cardId]
        })

        if (alreadyChosen === 1) {
            setTimeout(this.checkForMatch, 100)
        }
    }


    checkForMatch = async () => {
        const optionOneId = this.state.cardsChosenId[0]
        const optionTwoId = this.state.cardsChosenId[1]

        if (optionOneId == optionTwoId) {
            alert('You have clicked the same image!')
        } else if (this.state.cardsChosen[0] === this.state.cardsChosen[1]) {
            alert('You found a match')
            debugger
            this.setState({
                cardsWon: [...this.state.cardsWon, optionOneId, optionTwoId],
                tokenURIs: [...this.state.tokenURIs, CARD_ARRAY[optionOneId]]
            })
            // this.state.token.methods.mint(
            //     this.state.account,
            //     window.location.origin + CARD_ARRAY[optionOneId].img.toString()
            // )
            //     .send({ from: this.state.account })
            //     .on('transactionHash', (hash) => {

            //     })
        } else {
            alert('Sorry, try again')
        }
        this.setState({
            cardsChosen: [],
            cardsChosenId: []
        })
        if (this.state.cardsWon.length === CARD_ARRAY.length) {
            alert('Congratulations! You found them all!')
        }
    }
    render() {

        return (
            <div className="flex justify-center">
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <div className="container-fluid mt-5">
                            <div className="row">
                                <main role="main" className="col-lg-12 d-flex text-center">
                                    <div className="content mr-auto ml-auto">

                                        <div className="" style={{ width: "400px" }}>

                                            {this.state.cardArray.map((card, key) => {
                                                return (
                                                    <img
                                                        style={{ display: "inline-block" }}
                                                        key={key}
                                                        src={this.chooseImage(key)}
                                                        data-id={key}
                                                        onClick={(event) => {
                                                            let cardId = event.target.getAttribute('data-id')
                                                            if (!this.state.cardsWon.includes(cardId.toString())) {
                                                                this.flipCard(cardId)
                                                            }
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>

                                        <div>

                                            <h5>Tokens Collected:<span id="result">&nbsp;{this.state.tokenURIs.length}</span></h5>
                                            {this.state.tokenURIs.length > 0 && <h5>Tokens collected will be sold in 1 wei</h5>}

                                            <div className="mb-4" style={{ display: "inline-block" }}>

                                                {this.state.tokenURIs.map((tokenURI, key) => {

                                                    return (
                                                        <div style={{ display: "inline-block", marginRight: "5px" }}>
                                                            <img
                                                                style={{ display: "inline-block" }}
                                                                key={key}
                                                                src={tokenURI.img}
                                                                onClick={() => {
                                                                    if (confirm("Press a button!")) {
                                                                        this.createMarket(tokenURI)
                                                                    }
                                                                }}
                                                            />
                                                            <h4>{tokenURI.name}</h4>

                                                        </div>
                                                    )
                                                })}

                                            </div>

                                        </div>

                                    </div>

                                </main>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(game)