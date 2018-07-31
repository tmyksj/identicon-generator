(() => {
    let md5 = (message) => {
        let if_ = (condition, statement1, statement2) => {
            if (condition) {
                return statement1();
            } else {
                return statement2();
            }
        };

        let step0 = (message) => {
            return message.split("").map((value, index, array) => {
                return encodeURIComponent(value);
            }).map((value, index, array) => {
                return if_(value.length === 1, () => {
                    return [value.charCodeAt(0)];
                }, () => {
                    return value.split("%").filter((value, index, array) => {
                        return value.length > 0;
                    }).map((value, index, array) => {
                        return parseInt(value, 16);
                    });
                });
            }).reduce((previousValue, currentValue, currentIndex, array) => {
                return previousValue.concat(currentValue);
            }, []);
        };

        let step1 = (message) => {
            let charCode = step0(message).concat([0x80]).reduce((previousValue, currentValue, currentIndex, array) => {
                return if_(previousValue.length === 0 || previousValue[previousValue.length - 1].length === 4, () => {
                    return previousValue.concat([[currentValue]]);
                }, () => {
                    return previousValue.slice(0, previousValue.length - 1)
                        .concat([previousValue[previousValue.length - 1].concat([currentValue])]);
                });
            }, []).map((value, index, array) => {
                let v = value.concat([0, 0, 0, 0]);
                return v[0] + (v[1] << 8) + (v[2] << 16) + (v[3] << 24);
            });

            let zeroPadding = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let zeroPaddingLength = 16 - (charCode.length + 2) % 16;

            return charCode.concat(zeroPadding).slice(0, charCode.length + zeroPaddingLength);
        };

        let step2 = (message) => {
            return step1(message).concat([step0(message).length << 3, 0]);
        };

        let step3 = (message) => {
            return [
                0x67452301,
                0xefcdab89,
                0x98badcfe,
                0x10325476,
            ];
        };

        let step4 = (message) => {
            let addAll = (args) => {
                return if_(args.length === 2, () => {
                    let l = (args[0] & 0xffff) + (args[1] & 0xffff);
                    let h = (args[0] >> 16) + (args[1] >> 16) + (l >> 16);
                    return (h << 16) + (l & 0xffff);
                }, () => {
                    return addAll([args[0], addAll(args.slice(1))]);
                });
            };

            let rotateLeft = (x, n) => {
                return (x << n) | (x >>> 32 - n);
            };

            let f = (x, y, z) => {
                return x & y | ~x & z;
            };

            let g = (x, y, z) => {
                return x & z | y & ~z;
            };

            let h = (x, y, z) => {
                return x ^ y ^ z;
            };

            let i = (x, y, z) => {
                return y ^ (x | ~z);
            };

            let t = (i) => {
                return Math.floor(4294967296 * Math.abs(Math.sin(i)));
            };

            let loopBlock = (messageArray, abcd, index) => {
                return if_(messageArray.length === 16 * index, () => {
                    return abcd;
                }, () => {
                    let x = messageArray.slice(16 * index, 16 * (index + 1));

                    let round1 = (abcd, k, s, ii) => {
                        return addAll([abcd[1],
                            rotateLeft(addAll([abcd[0], f(abcd[1], abcd[2], abcd[3]), x[k], t(ii)]), s)]);
                    };

                    let round2 = (abcd, k, s, ii) => {
                        return addAll([abcd[1],
                            rotateLeft(addAll([abcd[0], g(abcd[1], abcd[2], abcd[3]), x[k], t(ii)]), s)]);
                    };

                    let round3 = (abcd, k, s, ii) => {
                        return addAll([abcd[1],
                            rotateLeft(addAll([abcd[0], h(abcd[1], abcd[2], abcd[3]), x[k], t(ii)]), s)]);
                    };

                    let round4 = (abcd, k, s, ii) => {
                        return addAll([abcd[1],
                            rotateLeft(addAll([abcd[0], i(abcd[1], abcd[2], abcd[3]), x[k], t(ii)]), s)]);
                    };

                    let loop = (abcd, index) => {
                        return if_(index < 16, () => {
                            let k = index;
                            let s = [7, 12, 17, 22][index % 4];
                            return loop([abcd[3], round1(abcd, k, s, index + 1), abcd[1], abcd[2]],
                                index + 1);
                        }, () => {
                            return if_(index < 32, () => {
                                let k = (5 * index + 1) % 16;
                                let s = [5, 9, 14, 20][index % 4];
                                return loop([abcd[3], round2(abcd, k, s, index + 1), abcd[1], abcd[2]],
                                    index + 1);
                            }, () => {
                                return if_(index < 48, () => {
                                    let k = (3 * index + 5) % 16;
                                    let s = [4, 11, 16, 23][index % 4];
                                    return loop([abcd[3], round3(abcd, k, s, index + 1), abcd[1], abcd[2]],
                                        index + 1);
                                }, () => {
                                    return if_(index < 64, () => {
                                        let k = (7 * index) % 16;
                                        let s = [6, 10, 15, 21][index % 4];
                                        return loop([abcd[3], round4(abcd, k, s, index + 1), abcd[1], abcd[2]],
                                            index + 1);
                                    }, () => {
                                        return abcd;
                                    });
                                });
                            });
                        });
                    };

                    return loopBlock(messageArray, loop(abcd, 0).map((value, index, array) => {
                        return addAll([abcd[index], value]);
                    }), index + 1);
                });
            };

            return loopBlock(step2(message), step3(message), 0);
        };

        let step5 = (message) => {
            return step4(message).map((value, index, array) => {
                return [
                    value >> 0x00 & 0xff,
                    value >> 0x08 & 0xff,
                    value >> 0x10 & 0xff,
                    value >> 0x18 & 0xff,
                ].map((value, index, array) => {
                    return if_(value < 16, () => {
                        return "0" + value.toString(16);
                    }, () => {
                        return value.toString(16);
                    });
                }).join("");
            }).join("");
        };

        return step5(message);
    };

    let main = () => {
        let canvas = document.querySelector("canvas");
        let input = document.querySelector("input");

        let context = canvas.getContext("2d");
        let height = canvas.height;
        let width = canvas.width;

        let hslStyle = (color, alpha) => {
            let h = ((color & 0b11110000) >> 4) * 360 / 16;
            let s = ((color & 0b00001100) >> 2) * 5 + 40;
            let l = (color & 0b00000011) + 5 + 40;
            return "hsl(" + h + ", " + s + "%, " + l + "%, " + alpha + ")";
        };

        let drawIdenticon = (digest) => {
            let digestAs = (splitSpan) => {
                let digestBinary = digest.split("").map((value, index, array) => {
                    return ("0000" + parseInt(value, 16).toString(2)).slice(-4);
                }).join("");

                return splitSpan.map((value, index, array) => {
                    return parseInt(digestBinary.substring(value[0], value[1]), 2);
                });
            };

            let drawTriangle = (color, alpha, range, vertexToInt, intToX, intToY) => {
                context.beginPath();

                digestAs(color).forEach((value, index, array) => {
                    context.fillStyle = hslStyle(value, alpha);
                    context.lineWidth = 4;
                    context.strokeStyle = "#ffffff";
                });

                digestAs(range).forEach((value, index, array) => {
                    context.moveTo(intToX(vertexToInt(value, index, 0)), intToY(vertexToInt(value, index, 0)));
                    context.lineTo(intToX(vertexToInt(value, index, 1)), intToY(vertexToInt(value, index, 1)));
                    context.lineTo(intToX(vertexToInt(value, index, 2)), intToY(vertexToInt(value, index, 2)));
                    context.lineTo(intToX(vertexToInt(value, index, 0)), intToY(vertexToInt(value, index, 0)));
                });

                context.fill();
                context.stroke();
            };

            context.clearRect(0, 0, width, height);

            drawTriangle([[0, 8]], 0.8, [
                [8, 10], [10, 12], [12, 14], [14, 16],
                [16, 18], [18, 20], [20, 22], [22, 24],
                [24, 26], [26, 28], [28, 30], [30, 32],
                [32, 34], [34, 36], [36, 38], [38, 40],
            ], (value, index, vertex) => {
                let directionTable = [
                    [0, 1, 5],
                    [1, 6, 0],
                    [6, 5, 1],
                    [5, 0, 1],
                ];
                return index + Math.floor(index / 4) + directionTable[value][vertex];
            }, (i) => {
                return (i % 5) * width / 8;
            }, (i) => {
                return Math.floor(i / 5) * height / 8;
            });

            drawTriangle([[40, 48]], 0.4, [
                [48, 50], [50, 52], [52, 54], [54, 56],
            ], (value, index, vertex) => {
                let directionTable = [
                    [0, 1, 3],
                    [1, 4, 0],
                    [4, 3, 1],
                    [3, 0, 1],
                ];
                return index + Math.floor(index / 2) + directionTable[value][vertex];
            }, (i) => {
                return (i % 3) * width / 4;
            }, (i) => {
                return Math.floor(i / 3) * height / 4;
            });

            drawTriangle([[56, 64]], 0.2, [
                [64, 66],
            ], (value, index, vertex) => {
                let directionTable = [
                    [0, 1, 2],
                    [1, 3, 0],
                    [3, 2, 1],
                    [2, 0, 1],
                ];
                return index + directionTable[value][vertex];
            }, (i) => {
                return (i % 2) * width / 2;
            }, (i) => {
                return Math.floor(i / 2) * height / 2;
            });

            context.save();
            context.scale(1, -1);
            context.drawImage(canvas, 0, 0, width / 2, height / 2, 0, -height, width / 2, height / 2);
            context.restore();

            context.save();
            context.scale(-1, 1);
            context.drawImage(canvas, 0, 0, width / 2, height, -width, 0, width / 2, height);
            context.restore();
        };

        input.addEventListener("input", () => {
            drawIdenticon(md5(input.value));
        });

        drawIdenticon(md5(input.value));
    };

    window.addEventListener("DOMContentLoaded", () => {
        main();
    });
})();
