require(["gitbook"],
function(gitbook) {
    // 配置默认参数
    var defaultConfig = {
        "hide": true // 默认是隐藏模式
        ,
        "el": "h2,h3,h4" // 待抽取元素名，默认是抽取h2,h3,h4标题，标准的jQuery选择表达式
        ,
        "elevator": true // 默认有电梯效果
    };
    /**[Private]
     * 根据tagName更新目录序号对象
     * @param  {[String]} name  当前元素名称，e.g. "h2"
     * @param  {[Object]} level 当前层级对象，e.g. {"l1":0,"l2":0,"order":""}
     * 
     * @return {[String]}       返回更新之后的level对象, e.g. {"l1":2,"l2":1,"order":"2.1"}
     */
    var updateLevel = function(name, level) {
        if (name === "h2") {
            level.l1 += 1;
            if (level.l2 > 0) {
                level.l2 = 0;
                level.l3 = 0;
            }
            level.order = level.l1;
        } else if (name === "h3") {
            if (level.l3 > 0) {
                level.l3 = 0;
            }
            level.l2 += 1;

            level.order = "" + level.l1 + "." + level.l2;
        } else {
            level.l3 += 1;
            level.order = "" + level.l1 + "." + level.l2 + "." + level.l3;
        }
        return level;
    };

    /**[Private]
     * 将el元素提取成一行目录，字符串格式
     * @param {[String]} el         要编入目录的元素对象  e.g. "h2,h3"
     * @param {[Object]} titleLevel 当前层级对象          e.g. {"l1":0,"l2":0,"order":""}
     *
     * @returns {[String]}
     *        e.g. 
     *         <a href="#gtoc-title-49" class="gtoc-level gtoc-level-h2">
     *             <i class="levelNum">1、</i>
     *             Getting Started
     *         </a>
     */
    var addSubTitle = function(el, name, titleLevel) {
        var newLine, title, nId; // 获取标题所需要的内容和连接
        title = el.text();

        // 使用jQuery的guid保证唯一
        nId = "gtoc-title-" + ($.guid++); //创建新的hrefID
        el.attr("id", nId); // 重新给节点赋值Id
        el.addClass("chapter");
        el.text(titleLevel.order + " " + title);

        // 每一行链接的字符串，使用tagName创建层级类名
        newLine = "<a href='#" + nId + "' class='gtoc-level gtoc-level-" + name + "'>" + "<i class='levelNum'>" + titleLevel.order + ". </i>" + title + "</a>";

        return newLine;
    }

    /**[Public]
     * 内容初始化，构建目录
     * @param  {[jQuery]} $book     标准的book对象
     * @param  {[JSON]} config      配置项             e.g. {"el":"h2,h3"}
     * 
     * @return {[String]}           完整的目录字符串
     */
    var contentInit = function($book, config) {

        // 遍历文章主题
        var $page = $book.find(".page-inner .normal");

        // 默认抽取h2,h3标题
        // 定义toc字符串的“头部”
        var toc = "<nav role='navigation'>" + "<div class='gitbook-table-of-contents'>" + "<div class='gtoc-menu'>" + "<h2>目录</h2>";

        var titleLevel = {
            "l1": 0,
            "l2": 0,
            "l3": 0,
            "order": ""
        };

        // var newLine, el, title, link; // 获取标题所需要的内容和连接
        var titleStr, el;

        // 遍历指定的选择器，拼接toc的“主体”
        $page.find(config.el).each(function() {
            el = $(this);

            // 获取tagName
            name = el[0].tagName.toLowerCase();

            // 根据tagName更新titleLevel
            titleLevel = updateLevel(name, titleLevel);

            // 根据el元素获取目录字符串
            titleStr = addSubTitle(el, name, titleLevel);

            toc += titleStr; // 拼接到toc
        });

        // 拼接toc的“尾部”
        toc += "</div>" + "</div>" + "<div class='gtoc-menu-min'>" + "<a href='javascript:void(0)' class='j-scrollup'><span class='word word-normal icon icon-top'></span><span class='word word-hover'>回到顶部</span></a>" + "<a title='快捷键(T)' href='javascript:void(0)' class='state-hover j-toggle-menu'><span class='word word-normal'>TOC</span><span class='word word-hover'>切换目录</span></a>" + "</div>" + "</nav>";

        return $(toc); // 返回目录结构jQuery对象
    }

    var actionInit = function($toc) {
        // 定义快捷键t，收缩/展现目录
        Mousetrap.bind(['t'],
        function(e) {
            $toc.toggleClass("state-min");
            return false;
        });

        // 定义快捷键h，显示/隐藏目录
        Mousetrap.bind(['h'],
        function(e) {
            $toc.toggleClass("state-hide");
            return false;
        });

        // 点击shrink按钮，改变状态
        $toc.find(".j-toggle-menu").on("click",
        function() {
            $toc.toggleClass("state-min");
        });

        // 点击回到顶部按钮
        $toc.find(".j-scrollup").on("click",
        function() {
            // 当宽度大于1240时添加动画，body-inner是固定高度的
            // 当宽度小于1240时添加动画，body-inner是变高度，book-body是固定高度的
            $(".body-inner,.book-body").animate({
                scrollTop: 0
            },
            '1000', "linear");
        });

        // hover的时候更改名字
        $toc.find(".gtoc-menu-min .word").mouseenter(function() {
            $(this).parent().addClass("state-hover");
        }).mouseleave(function() {
            $(this).parent().removeClass("state-hover");
        });

        // 更改宽口的大小
        // console.log($toc.find(".gitbook-table-of-contents").height());      
        var height_toc = $toc.find(".gtoc-menu").height();

        // 当窗口高度小于内容的时候，添加.state-scroll
        // 这样目录就能够出现滚动条了
        var toggleScroll = function() {
            if ($(window).height() < height_toc) {
                $toc.addClass("state-scroll");
            } else {
                $toc.removeClass("state-scroll");
            }
        }

        // 页面刚载入需要
        toggleScroll();

        // 响应页面伸缩事件
        $(window).on("resize",
        function() {
            toggleScroll();
        });

    };

    /**[public]
     * 根据提供的ID数组
     * @param  {[Array]} navId 元素ID属性（带#号）数组
     * 
     * @return {[Array]}       返回对应的距离顶部数值
     */
    var getTopValue = function(navId, offset) {
        var topValueSet = [];
        var offset = offset || 0; // 可能需要修正，比如要考虑头部高度
        // 循环遍历获取每个条目到顶部的距离值
        for (var i = 0; i < navId.length; i++) {
            topValueSet.push( + $('' + navId[i]).offset().top + offset);
        }

        return topValueSet;
    };

    /**[public]
     * 获取该值所在的区间范围的索引值
     * @param  {[int]} value     数值
     * @param  {[Array]} valueSet 数值所在的数组
     * @param  {[int]} offset   偏移值
     * 
     * @return {[int]}          区间所在索引值
     */
    var getCurrentPos = function(value, valueSet, offset) {
        var offset = offset || 0;
        var index = -1; // 最上面的区域定义index为-1
        var value = value + offset; // 这里添加一个固定的值作为偏移
        for (var i = 0; i < valueSet.length; i++) {
            if (value < valueSet[0]) {
                return index + 1; // 为了视觉连贯，让在第一屏的时候也高亮第一个标签
            } else if (value > valueSet[valueSet.length - 1]) {
                return index + valueSet.length;
            } else if (value < valueSet[i] && valueSet[i - 1] && value > valueSet[i - 1]) {
                return index + i;
            }
        }
    }

    /**[public]
     * 
     * 初始化电梯组件
     * @param  {[jQuery]} $toc 目录对象
     * 
     * @return none     添加scroll事件，完成电梯功能
     */
    var elevatorInit = function($toc) {

        // 所有的标题链接是存储在目录a标签里的
        var navId = [];
        var menu = $toc.find(".gtoc-menu");
        var link = menu.find("a");

        var scrollBody = $(".body-inner,.book-body");

        link.each(function() {

            var node = $(this);
            navId.push(node.attr("href"));

            // 为了防止出现"闪烁"问题，需要修改href属性
            node.data("href", node.attr("href"));
            node.attr("href", "javascript:void(0);");
        });
        // 将所有标题距离顶部的距离放置在topValue数组中
        var topValueSet = getTopValue(navId, 0); // 后面的数值用于修正
        // 获取当前点击的Index值
        menu.on("click", "a",
        function() {
            var index = link.index(this); // 获取当前链接索引值
            // 滚动到目标地址
            scrollBody.animate({
                scrollTop: +topValueSet[index]
            },
            '1000', "linear");

            link.removeClass("state-current");
            $(this).addClass("state-current");
        });

        // 添加滚动事件，增加电梯
        scrollBody.on("scroll",
        function() {
            // 先清除掉所有的active样式
            link.removeClass("state-current");
            // 获取当前滚动条的距离
            var topValue = Math.max(scrollBody[0].scrollTop, scrollBody[1].scrollTop); // 获取实际滚动距离
            // 根据距离判断应当让哪个导航高亮
            var nIndex = getCurrentPos(topValue, topValueSet, 40);
            $(link[nIndex]).addClass("state-current");
        });
    };

    var resetToc = function(config) {
        var $ibook = gitbook.state.$book;

        var _config = $.extend(defaultConfig, config);

        // 获取目录结构
        var $toc = contentInit($ibook, _config);
        // 将TOC绑定到文章里面
        $ibook.find(".book-body").append($toc);

        // 是否默认隐藏
        if (_config.hide) {
            $toc.addClass("state-min");
        };

        // 交互初始化
        actionInit($toc);

        // 默认开启“电梯”效果
        if (_config.elevator) {
            elevatorInit($toc); // 初始化电梯
        }

    };

    // 创建目录
    var init = function() {
        var config = {};
        resetToc(config);
    };

    // 当刷新页面的时候，重新创建目录
    gitbook.events.bind("page.change",
    function() {
        init();
    });
});
