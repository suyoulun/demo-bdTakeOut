
$(function () {
    var $mainCont = $("#mainCont"),
        $main = $mainCont.find(".main"),
        $tbody = $("#dataTable"),
        $slide = $mainCont.find(".scrollBar .block"),
        $pageInfo = $mainCont.find(".page-info"),
        $info = $("#songInfo"),
        $Audio = $("#audioTag"),
        $player = $("#player"),
        $lyricPage = $("#lyricPage"),
        $lyricList = $lyricPage.find(".lyricList"),
        cache = {},     //缓存
        timeArr = [];

    getMusic("我们不一样", 1);
    getLyric(3585639);

    //榜单
    (function(){
        var data = [
                {id:3, desc:"欧美"},
                {id:4, desc:"流行榜"},
                {id:5, desc:"内地"},
                {id:6, desc:"港台"},
                {id:16, desc:"韩国"},
                {id:17, desc:"日本"},
                {id:26, desc:"热歌"},
                {id:27, desc:"新歌"},
                {id:28, desc:"网络歌曲"},
                {id:32, desc:"音乐人"},
                {id:36, desc:"K歌金曲"}
            ],
            $rankList = $("#rankList");
        //渲染数据
        for (var key in data) {
            $("<dd><a>"+data[key]['desc']+"</a></dd>").appendTo($rankList).data({
                "data-searchId" : data[key]["id"],
                "data-desc" : data[key]["desc"]
            }).click(function(){
                $(this).addClass("on").siblings().removeClass("on");
                getRankListData($(this).data("data-searchId"), $(this).data("data-desc"))
            });
        }

        //ajax获取榜单
        function getRankListData(uid, word) {
            var url = "https://route.showapi.com/213-4?showapi_appid=52166&showapi_test_draft=false&showapi_timestamp="+getNowDate()+"&topid="+uid+"&showapi_sign=918f751a874d4db791a41f280cd17cd0";
            $.getJSON(url,function (data, param) {
                console.log(data, word);
                param = {
                    contentlist: data.showapi_res_body.pagebean.songlist,
                    currentPage: 1,
                    allPages: 1,
                    maxResult: 1
                };
                setData(param, word)
            })
        }
    })();



    //搜索音乐
    (function () {
        var $search = $("#search"),
            $searchBtn = $("#searchBtn");

        $search.on("keydown", function (e) {
            if (e.keyCode === 13 && this.value){
                searchFn()
            }
        });
        $searchBtn.on("click", function () {
            if ($search.val()){
                searchFn()
            }
        });
        $lyricPage.find(".lyric-singer").on("click",function () {
            $search.val($(this).html());
            searchFn()
        });
        $lyricPage.find(".lyric-album").on("click",function () {
            $search.val($(this).html());
            searchFn()
        });
        function searchFn() {
            getMusic($search.val(), 1);
            $lyricPage.fadeOut(200);
            $search.val("")
        }
    })();
    
    //请求数据
    function getMusic(word, page) {
        console.log("关键字: %s\n页数: %s",word, page);
        if (word===$tbody.data("w") && page===$tbody.data("currentPage")) {return;}
        if (cache[word] && cache[word][page]) {
            setData(cache[word][page], word);
        } else {
            var url = "https://route.showapi.com/213-1?keyword=" + word + "&page=" + page + "&showapi_appid=52166&showapi_test_draft=false&showapi_timestamp=" + getNowDate() + "&showapi_sign=918f751a874d4db791a41f280cd17cd0";
            $.getJSON(url, function (data) {
                var obj = data.showapi_res_body.pagebean;
                data.showapi_res_code===0 && setData(obj, word);
                console.log("请求数据\n",obj);
                //缓存
                if (!cache[word]) cache[word] = [];
                cache[word][obj.currentPage] = obj;
            })
        }

        console.log("cache\n",cache);
    }

    //处理数据
    function setData(data, word) {
        var w = data.w,                         //关键词
            currentPage = data.currentPage || 0,     //当前页
            allPages = data.allPages || 0,           //总页数
            maxResult = data.maxResult,         //当前页结果
            contentlist = data.contentlist;     //结果列表

        $tbody.html("");
        currentPage*1===1 && $tbody.data({allPages : allPages, w : word});
        $tbody.data({
            currentPage : currentPage,
            maxResult : maxResult
        });

        for (var i in contentlist) {
            var $tr = $("<tr><td>"
                + FM(i * 1 + 1) + "</td><td>"
                + (contentlist[i].songname || "未知") + "</td><td>"
                + (contentlist[i].singername || "未知") + "</td><td>"
                + (contentlist[i].albumname || "未知") + "</td></tr>");
            $tr.data({
                songname: contentlist[i].songname || "未知",              //歌名
                singername: contentlist[i].singername || "未知",          //歌手
                albumname: contentlist[i].albumname || "未知",            //专辑
                songid: contentlist[i].songid,                  //歌id
                m4a: contentlist[i].m4a || contentlist[i].url,   //音频
                albumpic_small: contentlist[i].albumpic_small,  //小图
                albumpic_big: contentlist[i].albumpic_big      //大图
            }).appendTo($tbody);
        }
        //滚动条
        setScroll($mainCont,$main,$slide);
        //页数
        $pageInfo.html($tbody.data("currentPage")+"/"+$tbody.data("allPages"))
    }

    //播放按钮
    (function () {
        var $playBtn = $player.find(".playBtn"),
            $prevBtn = $player.find(".prevBtn"),
            $nextBtn = $player.find(".nextBtn");
        //播放暂停
        $playBtn.on("click",function () {
            $(this).toggleClass("playing pause");
            $Audio.get(0)[$(this).hasClass("playing")?"pause":"play"]();
        });
        //上一首
        $prevBtn.on("click",function () {
            var idx = $Audio.data("idx") || 0,
                idxMax = $tbody.data("maxResult");
            if ($Audio.data("runType") === "shuffle") {
                idx = Math.ceil(Math.random()*idxMax)
            } else {
                idx--;
                idx = idx<0? idxMax-1:idx;
            }
            runMusic($tbody.children("tr").eq(idx))
        });
        //下一首
        $nextBtn.on("click",function () {
            var idx = $Audio.data("idx") || 0,
                idxMax = $tbody.data("maxResult");
            if ($Audio.data("runType") === "shuffle") {
                idx = Math.ceil(Math.random()*idxMax)
            } else {
                idx++;
                idx %= idxMax;
            }
            runMusic($tbody.children("tr").eq(idx))
        });

        //双击tr
        $tbody.on("dblclick","tr",function () {
            $playBtn.addClass("pause").removeClass("playing");
            runMusic($(this))
        });

    })();
    //播放音乐
    function runMusic(obj) {
        var url = obj.data("m4a"),
            songname = obj.data("songname"),
            singername = obj.data("singername"),
            albumpic_small = obj.data("albumpic_small"),
            albumpic_big = obj.data("albumpic_big"),
            albumname = obj.data("albumname"),
            songid = obj.data("songid");
        obj.addClass("on").siblings().removeClass("on");
        $player.find(".playBtn").addClass("pause").removeClass("playing");

        $Audio.data(obj.data());
        $Audio.data("idx",obj.index());
        $Audio.prop("src", url)[0].play();

        $info.children("img").prop("src", albumpic_small);
        $info.children(".info-song").html(songname);
        $info.children(".info-singer").html(singername);

        $lyricPage.find(".picBox img").prop("src", albumpic_big);
        $lyricPage.find(".lyric-song").html(songname);
        $lyricPage.find(".lyric-singer").html(singername);
        $lyricPage.find(".lyric-album").html(albumname);
        $lyricPage.find(".lyricPage-bg").css("background-image", "url("+albumpic_big+")");  //歌曲页背景
        getLyric(songid);
    }

    //滚动条
    function setScroll($1, $2, $3) {
    /**
     * @param $1 外容器
     * @param $2 内容器
     * @param $3 滑块
     */
        $1.off("mousewheel");
        $2.css("top", 0);
        $3.css("top", 0).off("mousedown");

        var $1Height = $1.height(),
            $2Height = $2.height(),
            $3ParentHeight = $3.offsetParent().height(),
            beyond = $2Height - $1Height,       //超出高度
            bili = $1Height / $2Height,         //比例
            moveMax;

        if (bili>1) {$3.height(0);return;}
        //滑块高度
        $3.height(bili*$3ParentHeight);
        moveMax = $3ParentHeight - $3.height();
        //滚动事件
        $1.on("mousewheel",function (e, d) {
            e.stopPropagation();
            e.preventDefault();
            moveFn($3.position().top + (d<0? 20 : -20))
        });
        //拖动事件
        $3.on("mousedown",function (e) {
            var oldTop = $3.position().top,
                y = e.clientY;
            $(document).on("mousemove",function (e) {
                e.preventDefault();
                moveFn(oldTop + e.clientY - y)
            }).one("mouseup",function () {
                $(this).off("mousemove")
            });
        });

        function moveFn(top) {
            top = Math.max(top, 0);
            top = Math.min(top, moveMax);
            $3.css("top",top);
            $2.css("top",-top*beyond/moveMax);
        }
    }

    //换页按钮
    (function () {
        var $firstPage = $("#firstPage"),
            $lastPage = $("#lastPage"),
            $prevPage = $("#prevPage"),
            $nextPage = $("#nextPage");
        //首页
        $firstPage.on("click",function () {
            if ($tbody.data("currentPage")===1) return;
            getMusic($tbody.data("w"), 1)
        });
        //末页
        $lastPage.on("click",function () {
            if ($tbody.data("currentPage")===$tbody.data("allPages")) return;
            getMusic($tbody.data("w"), $tbody.data("allPages"))
        });
        //上一页
        $prevPage.on("click",function () {
            if ($tbody.data("currentPage")===1) return;
            getMusic($tbody.data("w"), $tbody.data("currentPage")*1-1)
        });
        //下一页
        $nextPage.on("click",function () {
            if ($tbody.data("currentPage")===$tbody.data("allPages")) return;
            getMusic($tbody.data("w"), $tbody.data("currentPage")*1+1)
        });
    })();

    //进度条
    (function () {
        var $schedule = $player.find(".schedule"),
            $red = $schedule.children(".red"),
            $block = $schedule.children(".block"),
            widthMax = $schedule.width()-$block.width();

        var $playtime = $player.find(".playtime"),
            $present = $playtime.children(".present"),
            $total = $playtime.children(".total");
        //拖动
        $block.on("mousedown",function (e) {
            $Audio.off("timeupdate");
            var left = $block.position().left,
                x = e.clientX;
            $(document).on("mousemove",function (e) {
                e.preventDefault();
                var move = e.clientX-x+left;
                move = Math.max(move, 0);
                move = Math.min(move, widthMax);
                $block.css("left", move);
                $red.width(move);

            }).one("mouseup",function () {
                $Audio[0].currentTime = $red.width()/widthMax*$Audio[0].duration;
                $(this).off("mousemove");
                $Audio.on("timeupdate",timeup);
            })
        });
        //播放事件
        $Audio.on("timeupdate",timeup)
        .on("ended",function () {
            $block.css("left", 0);
            $red.width(0);
            $player.find(".playBtn").addClass("playing").removeClass("pause");
            var idx = $Audio.data("idx"),
                idxMax = $tbody.data("maxResult"),
                type = $(this).data("runType");
            if (type === "cycle") {
                idx++;
            } else if (type === "shuffle") {
                idx = Math.ceil(Math.random()*idxMax)
            } else {
                $Audio[0].play();
                return;
            }
            idx %= idxMax;
            runMusic($tbody.children("tr").eq(idx))
        });
        function timeup() {
            var duration = FTime(this.duration),
                currentTime = FTime(this.currentTime),
                prop = this.currentTime/this.duration;
            $present.html(currentTime);
            $total.html(duration);
            $block.css("left", widthMax*prop);
            $red.width(widthMax*prop);
            lyricMove(this.currentTime)
        }
    })();

    //音量条
    (function () {
        var $volume = $player.find(".volume"),
            $red = $volume.children(".red"),
            $block = $volume.children(".block"),
            widthMax = $volume.width()-$block.width();

        //初始
        $Audio[0].volume = 0.5;
        $block.css("left", widthMax*0.5);
        $red.width(widthMax*0.5);

        //拖动
        $block.on("mousedown",function (e) {
            var left = $block.position().left,
                x = e.clientX;
            $(document).on("mousemove",function (e) {
                e.preventDefault();
                var move = e.clientX-x+left;
                move = Math.max(move, 0);
                move = Math.min(move, widthMax);
                $block.css("left", move);
                $red.width(move);
                $Audio[0].volume = $red.width()/widthMax;
            }).one("mouseup",function () {
                $(this).off("mousemove")
            })
        });
    })();

    //循环方式
    (function () {
        var $runType = $player.find(".run-type");
        var type1 = "cycle",
            type2 = "single",
            type3 = "shuffle";
        $runType.on("click",function () {
            if ($(this).hasClass(type1)) {
                $(this).removeClass(type1).addClass(type2);
                $Audio.data("runType",type2);
            }
            else if ($(this).hasClass(type2)) {
                $(this).removeClass(type2).addClass(type3);
                $Audio.data("runType",type3);
            }
            else if ($(this).hasClass(type3)) {
                $(this).removeClass(type3).addClass(type1);
                $Audio.data("runType",type1);
            }
        });
        //初始
        $Audio.data("runType",$runType.attr("class").match(/\b\S+\b/g)[1]);
    })();

    //显示歌词页
    (function () {
        var $showlyric = $player.find(".lyric-icon"),
            $lyricPage = $(".lyricPage");
        $showlyric.on("click",function () {
            $lyricPage.fadeToggle(200)
        })
    })();

    //获取歌词
    function getLyric(id) {
        timeArr = [];
        var url = "https://route.showapi.com/213-2?&musicid="+id+"&showapi_appid=52166&showapi_test_draft=false&showapi_timestamp="+getNowDate()+"&showapi_sign=918f751a874d4db791a41f280cd17cd0";
        $.getJSON(url,function (data) {
            data = data.showapi_res_body.lyric;
            data = $lyricList.html(data).html();
            $lyricList.html("");
            data.replace(/\[(\d\d):(\d\d).+\](.+)/g,function(a,$1,$2,$3){
                $("<li></li>").data("time",$1*60+$2*1).html($3).appendTo($lyricList);
                timeArr.push($1*60+$2*1)
            })
        })
    }
    //歌词滚动
    function lyricMove(m) {
        var $list = $lyricList.children("li"),
            h = Math.min($list.eq(1).height(), $list.eq(8).height(), $list.eq(16).height());
        for (var i = 0, len = timeArr.length; i < len; i++) {
            if (timeArr[i]*1 > m) {
                break;
            }
        }
        $list.eq(i-1).addClass("on").siblings().removeClass("on");
        var t;
        $list.eq(i).position() && (t = $list.eq(i).position().top-h*5);
        $lyricList.css("top", -t);
    }


    //获取当前时间
    function getNowDate() {
        var date = new Date();
        return date.getFullYear() + FM(date.getMonth() + 1) + FM(date.getDate()) + FM(date.getHours()) + FM(date.getMinutes()) + FM(date.getSeconds())
    }
    function FM(n) {
        return n<10?"0"+n:""+n
    }
    function FTime(n) {
        return isNaN(n)? "00:00":FM(Math.floor(n/60)) + ":" + FM(Math.floor(n%60))
    }
});
/*

*/