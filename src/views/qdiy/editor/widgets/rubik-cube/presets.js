/**
 * 图片魔方的预设布局
 * 原样提取自 PHP common/rubik-cube/style.php 内联的 imgInfo（约 330 行）
 *
 * 每项：{ img 示意图, text 名称, data: { density 网格密度, info 预设区域数组 } }
 * info 里的 start/end 是网格坐标，交给 diy-rubik-cube 控件按 styleArr 生成区域。
 *
 * ⚠️ img 指向 PHP 侧 resources/img/decorate/ 下的示意图，平台端没有该资源，
 * 缺图不影响布局选择与生成。
 */
export const cubePresets = [
                    {
                        img: "cube-diy.png",
                        text: "风格1",
                        data: {
                            density: 4,
                            info: [],
                        }
                    },{
                        img: "cube1.png",
                        text: "风格2",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 1,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube2.png",
                        text: "风格3",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube3.png",
                        text: "风格4",
                        data: {
                            density: 3,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 1,
                                        y: 3
                                    }
                                },{
                                    start: {
                                        x: 2,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 3
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 3,
                                        y: 3
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube4.png",
                        text: "风格5",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 1,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube5.png",
                        text: "风格6",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 1,
                                        y: 3
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube6.png",
                        text: "风格7",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 1,
                                        y: 3
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube7.png",
                        text: "风格8",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube8.png",
                        text: "风格9",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 1,
                                        y: 3
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },{
                        img: "cube10.png",
                        text: "风格10",
                        data: {
                            density: 4,//密度
                            info: [
                                {
                                    start: {
                                        x: 1,
                                        y: 1
                                    },
                                    end: {
                                        x: 2,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 1
                                    },
                                    end: {
                                        x: 4,
                                        y: 2
                                    }
                                },{
                                    start: {
                                        x: 3,
                                        y: 3
                                    },
                                    end: {
                                        x: 3,
                                        y: 4
                                    }
                                },{
                                    start: {
                                        x: 4,
                                        y: 3
                                    },
                                    end: {
                                        x: 4,
                                        y: 4
                                    }
                                },
                            ]
                        }
                    },
];

export default cubePresets;
