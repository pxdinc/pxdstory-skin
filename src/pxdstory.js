// @ts-nocheck
$(function () {
  $(".date").each(function () {
    const obj = $(this)
    const smartdate = smart_date(obj.text())
    obj.html(smartdate)
  })

  $(".area_popup").scroll(() => {
    $("input.inp_search:first").attr("autofocus", "autofocus").blur()
  })

  $("button.btn_search").click((e) => {
    $("input.inp_search").attr("placeholder", "")
    e.stopPropagation()
    $(".area_popup").show()
    $("input.inp_search:first").attr("autofocus", "autofocus").focus()
  })

  //abtest();
  easy_nav()
  remove_private_category()
  new_article_list_author()
  show_reference_tag()

  setTimeout(function () {
    add_article_edit_link()
    show_profile()
    show_author_article()
    fetchRelativeList()

    // abtest()
  }, 2000)

  show_fb_reply(document, "script", "facebook-jssdk")
})

function add_article_edit_link() {
  if (!$("#article_modify_link").length) return
  const link = document.location.href
  const article_id = link.match(/\/[0-9]+/)
  $("#article_modify_link").attr("href", "/manage/newpost" + article_id)
}

function show_profile() {
  const author = $(".author:first")
    .text()
    .replace(/ \(.*\)/, "")

  const div = $("<div>").addClass("about_author")
  if ($(".area_tag").length) {
    $(".area_tag").after(div)
  } else {
    $(".article_content").prepend(div)
  }
  div.append("<div class=profile></div>")
  div.append("<h3 class=title_related>" + author + "님 최근 글</h3>")
  div.append("<ul id=author_article_list class=article_list></ul>")

  const url = "https://probetype.com/pxdstory/do_action.php?do=get_profile&name=" + author
  $.get(url, (data) => {
    if (!data) return

    const profile_div = $(".profile")
    profile_div.append(
      $(
        "<div class=profile_text><span class=name>" +
          data.name +
          "</span><span class=desc>" +
          data.desc +
          "</span></div>",
      ),
    )

    let imageUrl = data.img
    if (!imageUrl) return

    if (!imageUrl.match("^http")) imageUrl = "http:" + imageUrl
    const img = $("<div>")
      .css("background-image", "url('" + imageUrl + "')")
      .addClass("profile_img")
    profile_div.prepend(img)
    const img2 = img.clone().addClass("small")
    const name_obj = $(".author").eq(0)
    const name = name_obj.text()
    name_obj.html("<span class=name>" + name + "</span>")
    name_obj.prepend(img2)
  })
}

function new_article_list_author() {
  const curation_articles = []
  $(".list_type_notice li a").each((i, element) => {
    const article_id = $(element)
      .attr("href")
      .match(/[0-9]+/)[0]
    curation_articles.push("/" + article_id)
    $(element).attr("article_id", article_id)
  })
  console.log(curation_articles)

  if (curation_articles.length == 0) {
    show_list_profile_img()
    return
  }

  const url = "https://story-api.pxd.systems/article-metas?urls=" + curation_articles
  $.get(url, (articles) => {
    if (!articles) return
    articles.forEach((article) => {
      const author = article.author
      const no = article.url.replace("/", "")
      $(".list_type_notice li a[article_id=" + no + "] .notice_author").text(author)
    })
    show_list_profile_img()
  })
}

function show_list_profile_img() {
  const authors = []
  $("li .author_list, li .notice_author").each((i, element) => {
    const author = $(element)
      .text()
      .replace(/ \(.*\)/, "")
      .trim()
    authors.push(author)
    $(element).attr("author", author)
  })

  const url2 = "https://probetype.com/pxdstory/do_action.php?do=get_profiles&name=" + authors
  console.log(authors)
  $.get(url2, function (data) {
    if (!data) return
    data.result.forEach((user) => {
      const img = user.img
      const author = user.name
      if (!img) return

      const url = "url('" + img + "')"
      const thumb = $("<div>").addClass("profile_img small").css("background-image", url)
      $("li span[author='" + author + "']").before(thumb)
    })
  })
}

function show_articles_by_tag(tags) {
  const url = "https://story-api.pxd.systems/article-metas?tags=" + tags

  $.get(url, (data) => {
    if (!data) return

    const articlesByTag = tags.map((t) => data.filter((a) => a["tags"].indexOf(t) !== -1))

    $(".tag_article_list").each((i, element) => {
      const articles = articlesByTag[i]
      element.before($("<h3>").addClass("title_related").text(tags[i])[0])
      articles.forEach((article) => {
        const title = article.title
        const author = article.author
        const imageUrl = article.thumbnail
        const date = smart_date(article.date, new Date(article.date))
        const no = article.url.replace("/", "")
        const li = $("<li>")
        li.html(
          "<a href=/" +
            no +
            "><img class=thumb loading=lazy src='" +
            imageUrl +
            "'><div class=info><span class=title>" +
            title +
            "</span> <br><span class=author>" +
            author +
            "</span> <span class=date>" +
            date +
            "</span></div> </a><br clear=both> ",
        )
        if (i >= 5) li.css("display", "none")
        element.append(li[0])
      })

      if (!articles.length <= 5) return
      const more_button = $("<span class=more_button>")
        .text(articles.length + "개 모두 보기")
        .click(function () {
          $(this).parent().children("li").show()
          $(this).hide()
        })
      $("li", element).eq(4).after(more_button)
    })
  })
}

function show_author_article() {
  const author = $(".author:first").text()
  const url = "https://story-api.pxd.systems/article-metas?authors=" + author
  $.get(url, (articles) => {
    if (!articles) return
    articles.sort((a, b) => b.date - a.date)

    const article_list_div = $("#author_article_list")

    articles.forEach((article, i) => {
      const title = article.title
      const imageUrl = article.thumbnail
      const date = smart_date(article.date, new Date(article.date))
      const no = article.url.replace("/", "")
      const li = $("<li article_id=" + no + ">")
      li.html(
        "<a href=/" +
          no +
          "><img class=thumb loading=lazy src='" +
          imageUrl +
          "'><span class=title>" +
          title +
          "</span> <br><span class=date>" +
          date +
          "</span></a><br clear=both> ",
      )
      if (i >= 5) li.css("display", "none")
      article_list_div.append(li)
    })

    if (articles.length <= 5) return
    let more_button = $("<span class=more_button>")
      .text(articles.length + "개 모두 보기")
      .click(function () {
        $(this).parent().children("li").show()
        $(this).hide()
      })
    $("li", article_list_div).eq(4).after(more_button)
  })
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function show_reference_tag() {
  let text = $(".article_view").html()
  if (!text) return

  const matches = text.matchAll(/\[참고##(.+?)##\]/gm)
  let tags = []

  for (let m of matches) {
    const tag = m[1]
    text = text.replace(m[0], "")
    tags.push(tag)
  }

  tags = tags.filter(onlyUnique)

  if (tags.length) $(".article_view").html(text)

  if (!tags.length && $(".tag_content").length) {
    tags.push($(".tag_content a:first").text())
  }

  tags.forEach((t) => {
    let article_list_div = $("<ul>").attr("tag", t).addClass("article_list").addClass("tag_article_list")
    $(".container_postbtn").before(article_list_div)
  })

  if (tags.length) {
    show_articles_by_tag(tags)
  }
}

function remove_private_category() {
  $("ul.category_list li").each(function () {
    if (
      $("a", this)
        .html()
        .match(/Private/)
    )
      $(this).remove()
  })
}

function abtest() {
  const url = window.location.href
  const testflag = url.match(/testcode=([^&]+)/)
  const testcode = testflag ? testflag[1] : ""
  // const rolling_dice = Math.random()
  // if(testcode=="" && rolling_dice<0.3) testcode="0506"
  console.log(testcode)

  const add_testcode = () => {
    $("a").each(function () {
      let link = $(this).attr("href")
      if (!link) return
      link += link.match(/\?/) ? "&" : "?"
      link += "testcode=" + testcode
      $(this).attr("href", link)
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

  const max = parseInt($(".area_paging .link_num:last").text())
  const current = parseInt($(".area_paging span.selected").text())
  const next_link_href = $(".link_page.link_next").attr("href")
  if (!next_link_href.match("page")) return

  let prev = current - 1
  let next = current + 1
  if (prev < 1) prev = ""
  if (next > max) next = ""

  const prev_link = $("<a>")
    .attr("href", "?page=" + prev)
    .text("이전")
  const next_link = $("<a>")
    .attr("href", "?page=" + next)
    .text("다음")
  const current_link = $("<a>")
    .attr("onclick", "expand_pages()")
    .text(current + "/" + max)
  const s = "<table><tr><td></td><td class=page_num></td><td></td></tr></table>"

  if (prev == "") prev_link.addClass("disabled")
  if (next == "") next_link.addClass("disabled")

  const new_paging = $("<div>").attr("id", "new_paging").html(s)
  new_paging.insertAfter($(".area_paging"))
  $("#new_paging td").eq(0).append(prev_link)
  $("#new_paging td").eq(1).append(current_link)
  $("#new_paging td").eq(2).append(next_link)

  const all_links = $("<div>").attr("id", "all_links").html("<table><tr></tr></table>")
  all_links.insertAfter(new_paging)
  for (let i = 1; i <= max; i++) {
    const link = $("<a>")
      .attr("href", "?page=" + i)
      .text(i)
    if (i === current) link.addClass("selected")
    $("#all_links tr:last").append($("<td>"))
    $("#all_links td:last").append(link)
    if (i % 10 === 0) $("#all_links table").append($("<tr>"))
  }
}

function expand_pages() {
  const view = $("#all_links").css("display")
  $("#all_links").css("display", view === "none" ? "block" : "none")
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
  const type_notice = document.querySelectorAll(".type_notice")
  for (let i = 0; i < type_notice.length; i++) {
    type_notice[i].classList.add("list" + i)
  }
  $(".list0").append("<div class='main-more-btn'><a href='/category/?page=1'><span>새로운 글 더보기</span></a></div>")
}

setTimeout(function () {
  mainStorySection()
}, 100)

async function fetchRelativeList() {
  const id = window.location.href.match(/\/([0-9]+)/)
  if (!id) return

  const res = await fetch("https://nlp.pxd.systems/corpora/pxd-story/docs/" + id[1] + "/similar-docs?n=4")
  const data = await res.json()
  if (data.length === 0) return

  const urls = data.map((articleId) => "/" + articleId)
  const res_meta = await fetch("https://story-api.pxd.systems/article-metas?urls=" + urls)
  const data_meta = await res_meta.json()

  urls.forEach((url, i) => {
    const found = data_meta.find((el) => el.url == url)
    found.idx = i
  })

  data_meta.sort((a, b) => a.idx - b.idx)

  makeRelativeList(data_meta)
}

function makeRelativeList(data) {
  const div = $("<div class=area_related><h3 class=title_related>관련글</h3><ul class=list_related></ul></div>")
  $(".area_related").before(div)
  data.forEach((obj, i) => {
    const author = obj.author
    const thumbnail = obj.thumbnail
    const title = obj.title
    const url = obj.url
    const date = smart_date("", new Date(obj.date))
    const item = $("<li>").addClass("item_related")
    const s =
      "<a href=" +
      url +
      ' class="link_related"><span class="thumnail item-thumbnail" style="background-image:url(\'' +
      thumbnail +
      '\')"></span><div class="box_content"><strong>' +
      title +
      '</strong><span class="author">' +
      author +
      '</span><br><span class="info">' +
      date +
      "</span></div></a>"
    item.html(s)
    $("ul", div).append(item)
  })

  $(".area_related").eq(1).css("display", "none")
}
