// @ts-nocheck
$(document).ready(function () {
  $(".date").each(function () {
    var obj = $(this)
    var date_str = obj.text()
    var smartdate = smart_date(date_str)
    obj.html(smartdate)
  })

  $(".area_popup").scroll(function () {
    $("input.inp_search:first").attr("autofocus", "autofocus").blur()
  })

  $("button.btn_search").click(function (e) {
    $("input.inp_search").attr("placeholder", "")
    e.stopPropagation()
    $(".area_popup").show()
    $("input.inp_search:first").attr("autofocus", "autofocus").focus()
  })

  //abtest();
  easy_nav()
  remove_private_category()
  new_article_list_author()

  setTimeout(function () {
    add_article_edit_link()
    show_profile()
    show_reference_tag()
    show_author_article()

    abtest()
  }, 2000)

  show_fb_reply(document, "script", "facebook-jssdk")
})

function add_article_edit_link() {
  if ($("#article_modify_link").length) {
    var link = document.location.href
    var article_id = link.match(/\/[0-9]+/)
    link = "/manage/newpost" + article_id
    $("#article_modify_link").attr("href", link)
  }
}

var author
function show_profile() {
  author = $(".author").text()
  author = author.replace(/ \(.*\)/, "")

  var div = $("<div>").addClass("about_author")
  $(".area_tag").after(div)
  div.append("<div class=profile></div>")
  div.append("<h3 class=title_related>" + author + "님 최근 글</h3>")
  div.append("<ul id=author_article_list class=article_list></ul>")

  var url = "https://probetype.com/pxdstory/do_action.php?do=get_profile&name=" + author
  $.get(url, function (data) {
    //console.log(data);
    data = data.replace(/\n/, "")
    if (data) {
      var json = JSON.parse(data)

      var profile_div = $(".profile")
      profile_div.append(
        $(
          "<div class=profile_text><span class=name>" +
            json.name +
            "</span><span class=desc>" +
            json.desc +
            "</span></div>",
        ),
      )

      let url = json.img
      if (url) {
        if (!url.match("^http")) url = "http:" + url
        var img = $("<div>")
          .css("background-image", "url('" + url + "')")
          .addClass("profile_img")
        profile_div.prepend(img)
        var img2 = img.clone().addClass("small")
        var name_obj = $(".author").eq(0)
        var name = name_obj.text()
        name_obj.html("<span class=name>" + name + "</span>")
        name_obj.prepend(img2)
      }
    }
    //console.log(json)
  })
}

function new_article_list_author() {
  let curation_articles = []
  $(".list_type_notice li a").each((i, element) => {
    let article_id = $(element)
      .attr("href")
      .match(/[0-9]+/)[0]
    curation_articles.push("/" + article_id)
    $(element).attr("article_id", article_id)
  })
  console.log(curation_articles)
  //let url="https://pxd-story-dashboard.g15e.com/article-data/author,article_id,thumbnail?ids="+curation_articles;
  let url = "https://story-api.pxd.systems/article-metas?urls=" + curation_articles

  if (curation_articles.length == 0) {
    show_list_profile_img()
    return
  }
  $.get(url, function (data) {
    if (!data) return
    let articles = data
    let authors = []
    articles.forEach((article) => {
      let author = article.author
      authors.push(author)
      let no = article.url.replace("/", "")
      let url = article.thumbnail
      url = "url(" + url + ")"

      $(".list_type_notice li a[article_id=" + no + "] .notice_author").text(author)
    })
    show_list_profile_img()
  })
}

function show_list_profile_img() {
  let authors = []
  $("li .author_list, li .notice_author").each((i, element) => {
    let author = $(element).text()
    author = author.replace(/ \(.*\)/, "")
    author = author.trim()
    authors.push(author)
    $(element).attr("author", author)
  })

  //unique
  var author = authors.filter((v, i, a) => a.indexOf(v) === i)

  let url2 = "https://probetype.com/pxdstory/do_action.php?do=get_profiles&name=" + authors
  console.log(authors)
  $.get(url2, function (data) {
    if (!data) return
    let json = JSON.parse(data)
    json.result.forEach((user) => {
      let img = user.img
      let author = user.name

      if (img) {
        let url = "url('" + img + "')"
        let thumb = $("<div>").addClass("profile_img small").css("background-image", url)
        $("li span[author='" + author + "']").before(thumb)
      }
    })
  })
}

function show_articles_by_tag(tags) {
  //var url="https://pxd-story-dashboard.g15e.com/article-data/author,tags,article_id,date,title,thumbnail?tags="+tags;
  var url = "https://story-api.pxd.systems/article-metas?tags=" + tags

  $.get(url, function (data) {
    //console.log(data);
    if (!data) return

    //var json=JSON.parse(data);
    let json = data
    let articlesByTag = []
    tags.forEach((t) => {
      let matches = json.filter((article) => article["tags"].indexOf(t) !== -1)
      articlesByTag.push(matches)
    })

    $(".tag_article_list").each((i, element) => {
      let articles = articlesByTag[i]
      element.before($("<h3>").addClass("title_related").text(tags[i])[0])
      articles.forEach((article, i) => {
        var title = article.title
        var author = article.author
        var url = article.thumbnail
        var date = article.date
        let no = article.url.replace("/", "")
        date = smart_date(date, new Date(date))
        var li = $("<li>")
        li.html(
          "<a href=/" +
            no +
            "><img class=thumb src='" +
            url +
            "'><div class=info><span class=title>" +
            title +
            "</span> <br><span class=author>" +
            author +
            "</span> <span class=date>" +
            date +
            "</span></div> </a><br clear=both> ",
        )
        //console.log(li);
        if (i >= 5) li.css("display", "none")
        element.append(li[0])
      })
      if (articles.length > 5) {
        let more_button = $("<span class=more_button>")
          .text(articles.length + "개 모두 보기")
          .click(function () {
            $(this).parent().children("li").show()
            $(this).hide()
          })
        $("li", element).eq(4).after(more_button)
      }
    })
  })
}

function show_author_article() {
  author = $(".author").text()
  //var url="https://pxd-story-dashboard.g15e.com/article-data/author,tags,title,article_id,thumbnail,date?author="+author;
  let url = "https://story-api.pxd.systems/article-metas?authors=" + author
  $.get(url, function (data) {
    //console.log(data);
    if (data) {
      //var json=JSON.parse(data);

      let json = data.slice(0, 5)
      json.sort(function (a, b) {
        return b.date - a.date
      })

      var article_list_div = $("#author_article_list")

      for (var i = 0; i < json.length; i++) {
        var article = json[i]
        var title = article.title
        //var text=article.text;
        var text = ""
        var url = article.thumbnail

        var date = article.date
        let no = article.url.replace("/", "")
        text = text.substring(0, 80)
        date = smart_date(date, new Date(date))
        var li = $("<li article_id=" + no + ">")
        li.html(
          "<a href=/" +
            no +
            "><img class=thumb src='" +
            url +
            "'><span class=title>" +
            title +
            "</span> <br><span class=date>" +
            date +
            "</span></a><br clear=both> ",
        )
        //console.log(title,text,date,no)
        article_list_div.append(li)
      }
    }
  })
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function show_reference_tag() {
  var text = $(".article_view").html()
  if (!text) return

  //console.log(text);
  var matches = text.matchAll(/\[참고##(.+?)##\]/gm)
  var tags = []

  for (m of matches) {
    var tag = m[1]
    text = text.replace(m[0], "")
    tags.push(tag)
  }

  tags = tags.filter(onlyUnique)

  if (tags.length) $(".article_view").html(text)

  if (!tags.length) {
    tags.push($(".tag_content a:first").text())
  }

  tags.forEach((tag) => {
    var article_list_div = $("<ul>").attr("tag", tag).addClass("article_list").addClass("tag_article_list")
    $(".container_postbtn").before(article_list_div)
    //article_list_div.append($("<li>").text(tag))
  })

  if (tags.length) {
    show_articles_by_tag(tags)
  }
}

function remove_private_category() {
  $("ul.category_list li").each(function () {
    var item = $(this)
    if (
      $("a", this)
        .html()
        .match(/Private/)
    )
      item.remove()
  })
}

function abtest() {
  var url = window.location.href
  var testflag = url.match(/testcode=([^&]+)/)
  var testcode = ""
  if (testflag) testcode = testflag[1]
  var rolling_dice = Math.random()
  //if(testcode=="" && rolling_dice<0.3) testcode="0506"
  console.log(testcode)

  var add_testcode = function () {
    $("a").each(function () {
      var link = $(this).attr("href")
      if (link) {
        link += link.match(/\?/) ? "&" : "?"
        link += "testcode=" + testcode
        $(this).attr("href", link)
      }
    })
  }

  if (testcode) {
    add_testcode()
    //testa(testcode);
  }
}

function testa(testcode) {
  //pagination 예전것 없애기
  if (testcode == "0506") {
    easy_nav()
  }
}

function easy_nav() {
  $(".area_paging").css("display", "none")
  if ($(".area_paging").length == 0) return

  var max = parseInt($(".area_paging .link_num:last").text())
  var current = parseInt($(".area_paging span.selected").text())
  var next_link_href = $(".link_page.link_next").attr("href")
  if (!next_link_href.match("page")) return

  var prev = current - 1
  var next = current + 1
  if (prev < 1) prev = ""
  if (next > max) next = ""

  var prev_link = $("<a>")
    .attr("href", "?page=" + prev)
    .text("이전")
  var next_link = $("<a>")
    .attr("href", "?page=" + next)
    .text("다음")
  var current_link = $("<a>")
    .attr("onclick", "expand_pages()")
    .text(current + "/" + max)
  var s = "<table><tr><td></td><td class=page_num></td><td></td></tr></table>"

  if (prev == "") prev_link.addClass("disabled")
  if (next == "") next_link.addClass("disabled")

  var new_paging = $("<div>").attr("id", "new_paging").html(s)

  new_paging.insertAfter($(".area_paging"))
  $("#new_paging td").eq(0).append(prev_link)
  $("#new_paging td").eq(1).append(current_link)
  $("#new_paging td").eq(2).append(next_link)

  var all_links = $("<div>").attr("id", "all_links").html("<table><tr></tr></table>")
  all_links.insertAfter(new_paging)
  for (var i = 1; i <= max; i++) {
    var link = $("<a>")
      .attr("href", "?page=" + i)
      .text(i)
    if (i == current) link.addClass("selected")
    $("#all_links tr:last").append($("<td>"))
    $("#all_links td:last").append(link)
    if (i % 10 == 0) $("#all_links table").append($("<tr>"))
  }
}
function expand_pages() {
  var view = $("#all_links").css("display")
  $("#all_links").css("display", view == "none" ? "block" : "none")
}

function show_fb_reply(d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0]
  if (d.getElementById(id)) return
  js = d.createElement(s)
  js.id = id
  js.src = "//connect.facebook.net/ko_KR/all.js#xfbml=1"
  fjs.parentNode.insertBefore(js, fjs)
}
function mainStorySection() {
  var type_notice = document.querySelectorAll(".type_notice")
  for (var i = 0; i < type_notice.length; i++) {
    selector = type_notice[0]
    type_notice[i].classList.add("list" + i)
  }
  $(".list0").append("<div class='main-more-btn'><a href='/category/?page=1'><span>새로운 글 더보기</span></a></div>")
}
setTimeout(function () {
  mainStorySection()
}, 100)
